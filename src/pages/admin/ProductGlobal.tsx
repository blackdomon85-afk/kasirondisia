import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Search } from "lucide-react";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

  // Filter products based on search query
  const filteredProducts = productGlobal.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

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
          <div className="mb-4 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari produk..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10"
              />
            </div>
          </div>
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
              {paginatedProducts.map((product) => (
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
          
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Menampilkan {startIndex + 1} - {Math.min(endIndex, filteredProducts.length)} dari {filteredProducts.length} produk
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Sebelumnya
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className="w-10"
                    >
                      {page}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Selanjutnya
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
