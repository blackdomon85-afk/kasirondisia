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
import { Download, Printer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Transaction {
  id: string;
  date: string;
  items: number;
  total: number;
}

const Reports = () => {
  const [selectedMonth, setSelectedMonth] = useState("01-2025");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchTransactions();
  }, [selectedMonth]);

  const fetchTransactions = async () => {
    const [month, year] = selectedMonth.split("-");
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);

    const { data: transactionData, error } = await supabase
      .from("transactions")
      .select(`
        id,
        created_at,
        total_amount
      `)
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString())
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Gagal memuat laporan",
        variant: "destructive",
      });
      return;
    }

    // Fetch transaction items count for each transaction
    const transactionsWithItems = await Promise.all(
      (transactionData || []).map(async (t) => {
        const { count } = await supabase
          .from("transaction_items")
          .select("*", { count: "exact", head: true })
          .eq("transaction_id", t.id);

        return {
          id: t.id.substring(0, 8).toUpperCase(),
          date: new Date(t.created_at).toLocaleDateString("id-ID"),
          items: count || 0,
          total: parseFloat(t.total_amount.toString()),
        };
      })
    );

    setTransactions(transactionsWithItems);
  };

  const totalRevenue = transactions.reduce((sum, t) => sum + t.total, 0);
  const totalItems = transactions.reduce((sum, t) => sum + t.items, 0);

  const handlePrint = () => {
    toast({
      title: "Print Laporan",
      description: "Fitur print akan tersedia segera",
    });
  };

  const handleDownload = () => {
    toast({
      title: "Download Laporan",
      description: "Fitur download akan tersedia segera",
    });
  };

  const generateMonthOptions = () => {
    const options = [];
    const currentDate = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      const value = `${month}-${year}`;
      const label = date.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
      options.push({ value, label });
    }
    return options;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-foreground">Laporan Bulanan</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownload}>
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Pilih Periode</CardTitle>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {generateMonthOptions().map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
