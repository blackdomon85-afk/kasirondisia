import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Transaction {
  id: string;
  date: string;
  items: number;
  total: number;
  category?: string;
}

const Reports = () => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [categories, setCategories] = useState<string[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    // Set default dates to current month
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    setStartDate(firstDay.toISOString().split("T")[0]);
    setEndDate(lastDay.toISOString().split("T")[0]);
    
    fetchCategories();
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      fetchTransactions();
    }
  }, [startDate, endDate, selectedCategory]);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("category");

    if (!error && data) {
      const uniqueCategories = [...new Set(data.map((p) => p.category))];
      setCategories(uniqueCategories);
    }
  };

  const fetchTransactions = async () => {
    const startDateTime = new Date(startDate);
    startDateTime.setHours(0, 0, 0, 0);
    const endDateTime = new Date(endDate);
    endDateTime.setHours(23, 59, 59, 999);

    let query = supabase
      .from("transactions")
      .select(`
        id,
        created_at,
        total_amount,
        transaction_items(product_name, quantity, subtotal)
      `)
      .gte("created_at", startDateTime.toISOString())
      .lte("created_at", endDateTime.toISOString())
      .order("created_at", { ascending: false });

    const { data: transactionData, error } = await query;

    if (error) {
      toast({
        title: "Error",
        description: "Gagal memuat laporan",
        variant: "destructive",
      });
      return;
    }

    // Filter by category if selected
    let filteredTransactions = transactionData || [];
    
    if (selectedCategory !== "all") {
      // Get products in selected category
      const { data: categoryProducts } = await supabase
        .from("products")
        .select("name")
        .eq("category", selectedCategory);

      const productNames = new Set(categoryProducts?.map(p => p.name) || []);
      
      // Filter transactions that have items from selected category
      filteredTransactions = filteredTransactions.filter(t => 
        t.transaction_items.some((item: any) => productNames.has(item.product_name))
      );
    }

    const transactionsWithItems = filteredTransactions.map((t) => {
      return {
        id: t.id.substring(0, 8).toUpperCase(),
        date: new Date(t.created_at).toLocaleDateString("id-ID"),
        items: t.transaction_items.length,
        total: parseFloat(t.total_amount.toString()),
      };
    });

    setTransactions(transactionsWithItems);
  };

  const totalRevenue = transactions.reduce((sum, t) => sum + t.total, 0);
  const totalItems = transactions.reduce((sum, t) => sum + t.items, 0);

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      transactions.map((t) => ({
        "ID Transaksi": t.id,
        Tanggal: t.date,
        "Jumlah Item": t.items,
        Total: t.total,
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan");

    const fileName = `Laporan_${startDate}_${endDate}${selectedCategory !== "all" ? `_${selectedCategory}` : ""}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    toast({
      title: "Berhasil",
      description: "Laporan berhasil diexport ke Excel",
    });
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text("Laporan Penjualan", 14, 20);
    
    doc.setFontSize(11);
    doc.text(`Periode: ${startDate} - ${endDate}`, 14, 30);
    if (selectedCategory !== "all") {
      doc.text(`Kategori: ${selectedCategory}`, 14, 37);
    }
    
    doc.text(`Total Transaksi: ${transactions.length}`, 14, selectedCategory !== "all" ? 44 : 37);
    doc.text(`Total Item: ${totalItems}`, 14, selectedCategory !== "all" ? 51 : 44);
    doc.text(`Total Pendapatan: Rp ${totalRevenue.toLocaleString("id-ID")}`, 14, selectedCategory !== "all" ? 58 : 51);

    autoTable(doc, {
      startY: selectedCategory !== "all" ? 65 : 58,
      head: [["ID Transaksi", "Tanggal", "Jumlah Item", "Total"]],
      body: transactions.map((t) => [
        t.id,
        t.date,
        t.items,
        `Rp ${t.total.toLocaleString("id-ID")}`,
      ]),
    });

    const fileName = `Laporan_${startDate}_${endDate}${selectedCategory !== "all" ? `_${selectedCategory}` : ""}.pdf`;
    doc.save(fileName);

    toast({
      title: "Berhasil",
      description: "Laporan berhasil diexport ke PDF",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-foreground">Laporan Penjualan</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToExcel}>
            <Download className="w-4 h-4 mr-2" />
            Export Excel
          </Button>
          <Button onClick={exportToPDF}>
            <FileText className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter Laporan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Tanggal Mulai</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Tanggal Akhir</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Kategori Produk</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kategori</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ringkasan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground mb-2">
                  Total Item Terjual
                </p>
                <p className="text-3xl font-bold text-foreground">{totalItems}</p>
                <p className="text-xs text-muted-foreground mt-1">unit</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground mb-2">
                  Total Pendapatan
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
                  Total Transaksi
                </p>
                <p className="text-3xl font-bold text-primary">
                  {transactions.length}
                </p>
                <p className="text-xs text-muted-foreground mt-1">transaksi</p>
              </CardContent>
            </Card>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID Transaksi</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Jumlah Item</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      Tidak ada transaksi pada periode ini
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium">{transaction.id}</TableCell>
                      <TableCell>{transaction.date}</TableCell>
                      <TableCell>{transaction.items} item</TableCell>
                      <TableCell className="text-right font-semibold text-primary">
                        Rp {transaction.total.toLocaleString("id-ID")}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
