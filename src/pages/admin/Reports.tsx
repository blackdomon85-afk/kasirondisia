import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Printer, Download } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface MonthlyReport {
  month: string;
  totalSales: number;
  totalTransactions: number;
  totalRevenue: number;
}

const MOCK_REPORTS: MonthlyReport[] = [
  {
    month: "Januari 2025",
    totalSales: 3240,
    totalTransactions: 1284,
    totalRevenue: 45200000,
  },
  {
    month: "Desember 2024",
    totalSales: 2980,
    totalTransactions: 1156,
    totalRevenue: 38500000,
  },
  {
    month: "November 2024",
    totalSales: 3120,
    totalTransactions: 1208,
    totalRevenue: 42100000,
  },
];

const Reports = () => {
  const [selectedMonth, setSelectedMonth] = useState("januari-2025");
  const { toast } = useToast();

  const handlePrint = () => {
    toast({
      title: "Print Laporan",
      description: "Laporan akan dicetak (simulasi)",
    });
  };

  const handleDownload = () => {
    toast({
      title: "Download Laporan",
      description: "Laporan sedang diunduh (simulasi)",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-foreground">
          Laporan Bulanan
        </h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownload}>
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Print Laporan
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Pilih Periode</CardTitle>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Pilih bulan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="januari-2025">Januari 2025</SelectItem>
                <SelectItem value="desember-2024">Desember 2024</SelectItem>
                <SelectItem value="november-2024">November 2024</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6 mb-6">
            <Card className="bg-primary/5">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground mb-2">
                  Total Penjualan
                </p>
                <p className="text-3xl font-bold text-primary">3,240</p>
                <p className="text-xs text-muted-foreground mt-1">unit</p>
              </CardContent>
            </Card>

            <Card className="bg-success/5">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground mb-2">
                  Total Pendapatan
                </p>
                <p className="text-3xl font-bold text-success">Rp 45,2 Jt</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Januari 2025
                </p>
              </CardContent>
            </Card>

            <Card className="bg-accent/5">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground mb-2">
                  Total Transaksi
                </p>
                <p className="text-3xl font-bold text-accent">1,284</p>
                <p className="text-xs text-muted-foreground mt-1">transaksi</p>
              </CardContent>
            </Card>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bulan</TableHead>
                  <TableHead>Total Penjualan</TableHead>
                  <TableHead>Total Transaksi</TableHead>
                  <TableHead>Total Pendapatan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MOCK_REPORTS.map((report, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      {report.month}
                    </TableCell>
                    <TableCell>{report.totalSales} unit</TableCell>
                    <TableCell>{report.totalTransactions}</TableCell>
                    <TableCell className="font-semibold text-success">
                      Rp {(report.totalRevenue / 1000000).toFixed(1)} Jt
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
