import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Pencil, Save, X } from "lucide-react";

interface Product {
  id: string;
  name: string;
  stock: number;
}

interface ProductUnit {
  id: string;
  product_id: string;
  pieces_per_bundle: number;
  products?: Product;
}

export default function ProductUnitMaster() {
  const [products, setProducts] = useState<Product[]>([]);
  const [productUnits, setProductUnits] = useState<ProductUnit[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<number>(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("id, name, stock")
        .order("name");

      if (productsError) throw productsError;

      const { data: unitsData, error: unitsError } = await supabase
        .from("product_units")
        .select("*, products(id, name, stock)");

      if (unitsError) throw unitsError;

      setProducts(productsData || []);
      setProductUnits(unitsData || []);
    } catch (error: any) {
      toast.error("Gagal memuat data: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (productId: string) => {
    try {
      const existingUnit = productUnits.find(u => u.product_id === productId);

      if (existingUnit) {
        const { error } = await supabase
          .from("product_units")
          .update({ pieces_per_bundle: editValue })
          .eq("id", existingUnit.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("product_units")
          .insert({ product_id: productId, pieces_per_bundle: editValue });

        if (error) throw error;
      }

      toast.success("Data satuan berhasil disimpan");
      setEditingId(null);
      fetchData();
    } catch (error: any) {
      toast.error("Gagal menyimpan: " + error.message);
    }
  };

  const startEdit = (productId: string) => {
    const unit = productUnits.find(u => u.product_id === productId);
    setEditingId(productId);
    setEditValue(unit?.pieces_per_bundle || 1);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue(1);
  };

  const getUnitForProduct = (productId: string) => {
    return productUnits.find(u => u.product_id === productId);
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8">
      <Card>
        <CardHeader>
          <CardTitle>Satuan Master Data Produk</CardTitle>
          <CardDescription>
            Atur berapa pcs dalam satu renteng untuk setiap produk
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Produk</TableHead>
                <TableHead>Stock Induk</TableHead>
                <TableHead>Stock per Renteng (PCS)</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => {
                const unit = getUnitForProduct(product.id);
                const isEditing = editingId === product.id;

                return (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>1 Renteng</TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Input
                          type="number"
                          min="1"
                          value={editValue}
                          onChange={(e) => setEditValue(parseInt(e.target.value) || 1)}
                          className="w-32"
                        />
                      ) : (
                        <span>{unit?.pieces_per_bundle || "-"} PCS</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {isEditing ? (
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleSave(product.id)}
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={cancelEdit}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startEdit(product.id)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
