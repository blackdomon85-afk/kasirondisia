import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, DollarSign, ShoppingCart, TrendingUp } from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Stats {
  totalProducts: number;
  totalRevenue: number;
  totalTransactions: number;
  bestSellingProduct: string;
}

interface SalesData {
  date: string;
  revenue: number;
}

interface ProductSales {
  name: string;
  quantity: number;
}

const Dashboard = () => {
  const [stats, setStats] = useState<Stats>({
    totalProducts: 0,
    totalRevenue: 0,
    totalTransactions: 0,
    bestSellingProduct: "-",
  });
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [productSales, setProductSales] = useState<ProductSales[]>([]);
  const [dateFilter, setDateFilter] = useState("week");

  useEffect(() => {
    fetchDashboardData();
  }, [dateFilter]);

  const fetchDashboardData = async () => {
    // Fetch total products
    const { count: productCount } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true });

    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    
    switch (dateFilter) {
      case "today":
        startDate.setHours(0, 0, 0, 0);
        break;
      case "yesterday":
        startDate.setDate(startDate.getDate() - 1);
        startDate.setHours(0, 0, 0, 0);
        break;
      case "week":
        startDate.setDate(startDate.getDate() - 7);
        break;
      case "month":
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case "year":
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
    }

    // Fetch transactions in date range
    const { data: transactions } = await supabase
      .from("transactions")
      .select("*")
      .gte("created_at", startDate.toISOString())
      .lte("created_at", now.toISOString());

    const totalRevenue = transactions?.reduce((sum, t) => sum + parseFloat(t.total_amount.toString()), 0) || 0;
    const totalTransactions = transactions?.length || 0;

    // Fetch best selling product
    const { data: itemData } = await supabase
      .from("transaction_items")
      .select("product_name, quantity")
      .gte("created_at", startDate.toISOString())
      .lte("created_at", now.toISOString());

    const productTotals: Record<string, number> = {};
    itemData?.forEach((item) => {
      productTotals[item.product_name] = (productTotals[item.product_name] || 0) + item.quantity;
    });

    const sortedProducts = Object.entries(productTotals).sort((a, b) => b[1] - a[1]);
    const bestSelling = sortedProducts[0]?.[0] || "-";

    // Prepare sales chart data
    const salesByDate: Record<string, number> = {};
    transactions?.forEach((t) => {
      const date = new Date(t.created_at).toLocaleDateString("id-ID", { 
        month: "short", 
        day: "numeric" 
      });
      salesByDate[date] = (salesByDate[date] || 0) + parseFloat(t.total_amount.toString());
    });

    const chartData = Object.entries(salesByDate).map(([date, revenue]) => ({
      date,
      revenue,
    }));

    // Prepare product sales data
    const topProducts = sortedProducts.slice(0, 5).map(([name, quantity]) => ({
      name,
      quantity,
    }));

    setStats({
      totalProducts: productCount || 0,
      totalRevenue,
      totalTransactions,
      bestSellingProduct: bestSelling,
    });
    setSalesData(chartData);
    setProductSales(topProducts);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Hari Ini</SelectItem>
            <SelectItem value="yesterday">Kemarin</SelectItem>
            <SelectItem value="week">Minggu Ini</SelectItem>
            <SelectItem value="month">Bulan Ini</SelectItem>
            <SelectItem value="year">Tahun Ini</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Produk</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-muted-foreground">Produk terdaftar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pendapatan</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              Rp {stats.totalRevenue.toLocaleString("id-ID")}
            </div>
            <p className="text-xs text-muted-foreground">Dari semua transaksi</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transaksi</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTransactions}</div>
            <p className="text-xs text-muted-foreground">Transaksi selesai</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produk Terlaris</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold line-clamp-1">
              {stats.bestSellingProduct}
            </div>
            <p className="text-xs text-muted-foreground">Paling banyak terjual</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Statistik Penjualan</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  name="Pendapatan (Rp)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Produk Terlaris</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={productSales}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="quantity" fill="hsl(var(--chart-1))" name="Jumlah Terjual" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
