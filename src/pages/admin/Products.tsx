import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Search, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Product {
  id: string;
  name: string;
  barcode: string;
  price: number;
  stock: number;
  category: string;
}

const MOCK_PRODUCTS: Product[] = [
  {
    id: "1",
    name: "Indomie Goreng",
    barcode: "8888001234567",
    price: 3500,
    stock: 450,
    category: "Makanan",
  },
  {
    id: "2",
    name: "Aqua 600ml",
    barcode: "8888001234568",
    price: 3000,
    stock: 380,
    category: "Minuman",
  },
  {
    id: "3",
    name: "Teh Pucuk",
    barcode: "8888001234569",
    price: 4000,
    stock: 320,
    category: "Minuman",
  },
  {
    id: "4",
    name: "Kopi Kapal Api",
    barcode: "8888001234570",
    price: 2500,
    stock: 280,
    category: "Minuman",
  },
  {
    id: "5",
    name: "Susu Ultra 250ml",
    barcode: "8888001234571",
    price: 5500,
    stock: 250,
    category: "Minuman",
  },
];

const Products = () => {
  const [products] = useState<Product[]>(MOCK_PRODUCTS);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.barcode.includes(searchQuery)
  );

  const handleEdit = (id: string) => {
    toast({
      title: "Edit Produk",
      description: "Fitur edit akan tersedia setelah backend diaktifkan",
    });
  };

  const handleDelete = (id: string) => {
    toast({
      title: "Hapus Produk",
      description: "Fitur hapus akan tersedia setelah backend diaktifkan",
      variant: "destructive",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-foreground">Produk</h1>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Tambah Produk
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Produk</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Cari produk atau barcode..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Produk</TableHead>
                  <TableHead>Barcode</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Harga</TableHead>
                  <TableHead>Stok</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">
                      {product.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {product.barcode}
                    </TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell className="font-semibold text-primary">
                      Rp {product.price.toLocaleString("id-ID")}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          product.stock < 100
                            ? "bg-destructive/10 text-destructive"
                            : "bg-success/10 text-success"
                        }`}
                      >
                        {product.stock}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(product.id)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(product.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
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

export default Products;
