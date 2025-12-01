import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  stock: number;
}

interface ProductUnit {
  product_id: string;
  pieces_per_bundle: number;
}

interface ProductGlobalView {
  id: string;
  name: string;
  totalStock: number;
  bundles: number;
  remainingPieces: number;
  piecesPerBundle: number;
}

export default function ProductGlobal() {
  const [productGlobal, setProductGlobal] = useState<ProductGlobalView[]>([]);
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
        .select("product_id, pieces_per_bundle");

      if (unitsError) throw unitsError;

      // Create a map of product_id to pieces_per_bundle
      const unitsMap = new Map<string, number>();
      unitsData?.forEach((unit: ProductUnit) => {
        unitsMap.set(unit.product_id, unit.pieces_per_bundle);
      });

      // Calculate bundles and remaining pieces for each product
      const globalData: ProductGlobalView[] = (productsData || []).map((product: Product) => {
        const piecesPerBundle = unitsMap.get(product.id) || 0;
        const bundles = piecesPerBundle > 0 ? Math.floor(product.stock / piecesPerBundle) : 0;
        const remainingPieces = piecesPerBundle > 0 ? product.stock % piecesPerBundle : product.stock;

        return {
          id: product.id,
          name: product.name,
          totalStock: product.stock,
          bundles,
          remainingPieces,
          piecesPerBundle,
        };
      });

      setProductGlobal(globalData);
    } catch (error: any) {
      toast.error("Gagal memuat data: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8">
      <Card>
        <CardHeader>
          <CardTitle>Satuan Produk Global</CardTitle>
          <CardDescription>
            Tampilan global stock produk dalam renteng dan pcs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Produk</TableHead>
                <TableHead>Total Stock (PCS)</TableHead>
                <TableHead>Stock dalam Renteng</TableHead>
                <TableHead>Sisa PCS</TableHead>
                <TableHead>PCS per Renteng</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productGlobal.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.totalStock} PCS</TableCell>
                  <TableCell>
                    {product.piecesPerBundle > 0 ? (
                      <span className="font-semibold">{product.bundles} Renteng</span>
                    ) : (
                      <span className="text-muted-foreground">Belum diatur</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {product.piecesPerBundle > 0 ? (
                      <span>{product.remainingPieces} PCS</span>
                    ) : (
                      <span>-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {product.piecesPerBundle > 0 ? (
                      <span>{product.piecesPerBundle} PCS</span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
