import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ReportItem {
  id: string;
  transactionId: string;
  date: string;
  productName: string;
  quantity: number;
  purchasePrice: number;
  sellingPrice: number;
  profit: number;
}

const Reports = () => {
  const [period, setPeriod] = useState("month");
  const [reportItems, setReportItems] = useState<ReportItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchReportData();
  }, [period]);

  const getDateRange = () => {
    const now = new Date();
    let startDateTime = new Date();
    let endDateTime = new Date();

    switch (period) {
      case "today":
        startDateTime.setHours(0, 0, 0, 0);
        endDateTime.setHours(23, 59, 59, 999);
        break;
      case "yesterday":
        startDateTime.setDate(now.getDate() - 1);
        startDateTime.setHours(0, 0, 0, 0);
        endDateTime.setDate(now.getDate() - 1);
        endDateTime.setHours(23, 59, 59, 999);
        break;
      case "week":
        startDateTime.setDate(now.getDate() - 7);
        startDateTime.setHours(0, 0, 0, 0);
        endDateTime.setHours(23, 59, 59, 999);
        break;
      case "month":
        startDateTime = new Date(now.getFullYear(), now.getMonth(), 1);
        endDateTime = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        break;
      case "year":
        startDateTime = new Date(now.getFullYear(), 0, 1);
        endDateTime = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        break;
      case "all":
        startDateTime = new Date(2000, 0, 1);
        endDateTime.setHours(23, 59, 59, 999);
        break;
    }

    return { startDateTime, endDateTime };
  };

  const fetchReportData = async () => {
    const { startDateTime, endDateTime } = getDateRange();

    // Fetch transaction items with transaction date
    const { data: transactionItems, error } = await supabase
      .from("transaction_items")
      .select(`
        id,
        product_name,
        product_price,
        quantity,
        subtotal,
        product_id,
        transaction_id,
        transactions!inner(created_at)
      `)
      .gte("transactions.created_at", startDateTime.toISOString())
      .lte("transactions.created_at", endDateTime.toISOString())
      .order("created_at", { foreignTable: "transactions", ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Gagal memuat laporan",
        variant: "destructive",
      });
      return;
    }

    // Fetch products to get purchase prices
    const { data: products } = await supabase
      .from("products")
      .select("id, purchase_price");

    const productPriceMap = new Map(
      products?.map((p) => [p.id, p.purchase_price]) || []
    );

    const items: ReportItem[] = (transactionItems || []).map((item: any) => {
      const purchasePrice = item.product_id 
        ? (productPriceMap.get(item.product_id) || 0) 
        : 0;
      const sellingPrice = item.product_price;
      const profit = (sellingPrice - purchasePrice) * item.quantity;

      return {
        id: item.id,
        transactionId: item.transaction_id,
        date: new Date(item.transactions.created_at).toLocaleDateString("id-ID"),
        productName: item.product_name,
        quantity: item.quantity,
        purchasePrice,
        sellingPrice,
        profit,
      };
    });

    setReportItems(items);
    setSelectedItems(new Set());
  };

  const toggleSelectItem = (id: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedItems.size === reportItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(reportItems.map(item => item.id)));
    }
  };

  const handleDeleteSelected = async () => {
    try {
      // Get unique transaction IDs from selected items
      const transactionIds = new Set(
        reportItems
          .filter(item => selectedItems.has(item.id))
          .map(item => item.transactionId)
      );

      // Delete transaction items first
      const { error: itemsError } = await supabase
        .from("transaction_items")
        .delete()
        .in("id", Array.from(selectedItems));

      if (itemsError) throw itemsError;

      // Check for empty transactions and delete them
      for (const txId of transactionIds) {
        const { data: remainingItems } = await supabase
          .from("transaction_items")
          .select("id")
          .eq("transaction_id", txId);

        if (!remainingItems || remainingItems.length === 0) {
          await supabase
            .from("transactions")
            .delete()
            .eq("id", txId);
        }
      }

      toast({
        title: "Berhasil",
        description: `${selectedItems.size} item laporan berhasil dihapus`,
      });

      setShowDeleteDialog(false);
      await fetchReportData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const totalQuantity = reportItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalProfit = reportItems.reduce((sum, item) => sum + item.profit, 0);
  const totalRevenue = reportItems.reduce((sum, item) => sum + (item.purchasePrice * item.quantity), 0);

  const getPeriodLabel = () => {
    switch (period) {
      case "today": return "Hari Ini";
      case "yesterday": return "Kemarin";
      case "week": return "Minggu Ini";
      case "month": return "Bulan Ini";
      case "year": return "Tahun Ini";
      case "all": return "Semua Data";
      default: return period;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-foreground">Laporan Penjualan</h1>
        {selectedItems.size > 0 && (
          <Button 
            variant="destructive" 
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Hapus ({selectedItems.size})
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter Laporan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-w-xs">
            <Label htmlFor="period">Periode</Label>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger id="period">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Hari Ini</SelectItem>
                <SelectItem value="yesterday">Kemarin</SelectItem>
                <SelectItem value="week">Minggu Ini (7 Hari Terakhir)</SelectItem>
                <SelectItem value="month">Bulan Ini</SelectItem>
                <SelectItem value="year">Tahun Ini</SelectItem>
                <SelectItem value="all">Semua Data</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ringkasan - {getPeriodLabel()}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground mb-2">
                  Total Item Terjual
                </p>
                <p className="text-3xl font-bold text-foreground">{totalQuantity}</p>
                <p className="text-xs text-muted-foreground mt-1">unit</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground mb-2">
                  Total Uang Kolaan
                </p>
                <p className="text-3xl font-bold text-success">
                  Rp {totalRevenue.toLocaleString("id-ID")}
                </p>
                <p className="text-xs text-muted-foreground mt-1">periode ini</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground mb-2">
                  Total Laba
                </p>
                <p className="text-3xl font-bold text-primary">
                  Rp {totalProfit.toLocaleString("id-ID")}
                </p>
                <p className="text-xs text-muted-foreground mt-1">keuntungan bersih</p>
              </CardContent>
            </Card>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={reportItems.length > 0 && selectedItems.size === reportItems.length}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Produk</TableHead>
                  <TableHead className="text-center">Qty</TableHead>
                  <TableHead className="text-right">Harga Beli</TableHead>
                  <TableHead className="text-right">Harga Jual</TableHead>
                  <TableHead className="text-right">Laba</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      Tidak ada transaksi pada periode ini
                    </TableCell>
                  </TableRow>
                ) : (
                  reportItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedItems.has(item.id)}
                          onCheckedChange={() => toggleSelectItem(item.id)}
                        />
                      </TableCell>
                      <TableCell>{item.date}</TableCell>
                      <TableCell className="font-medium">{item.productName}</TableCell>
                      <TableCell className="text-center">{item.quantity}</TableCell>
                      <TableCell className="text-right">
                        Rp {item.purchasePrice.toLocaleString("id-ID")}
                      </TableCell>
                      <TableCell className="text-right">
                        Rp {item.sellingPrice.toLocaleString("id-ID")}
                      </TableCell>
                      <TableCell className={`text-right font-semibold ${item.profit >= 0 ? 'text-success' : 'text-destructive'}`}>
                        Rp {item.profit.toLocaleString("id-ID")}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Laporan?</AlertDialogTitle>
            <AlertDialogDescription>
              Anda akan menghapus {selectedItems.size} item laporan. Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSelected}>Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Reports;
