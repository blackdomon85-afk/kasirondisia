import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, ArrowLeft, AlertTriangle } from "lucide-react";

interface Category {
  id: string;
  name: string;
}

const ProductFormPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const productId = searchParams.get("id");
  const isEdit = !!productId;

  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [barcode, setBarcode] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [price, setPrice] = useState("");
  const [wholesalePrice, setWholesalePrice] = useState("");
  const [wholesaleThreshold, setWholesaleThreshold] = useState("");
  const [stock, setStock] = useState("");
  const [category, setCategory] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchCategories();
    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("id, name")
      .order("name");

    if (!error && data) {
      setCategories(data);
    }
  };

  // Validasi harga beli lebih besar dari harga satuan
  const isPriceWarning = purchasePrice && price && parseFloat(purchasePrice) > parseFloat(price);

  const fetchProduct = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", productId)
      .single();

    if (error || !data) {
      toast({
        title: "Error",
        description: "Gagal memuat data produk",
        variant: "destructive",
      });
      navigate("/admin/products");
      return;
    }

    setName(data.name);
    setBarcode(data.barcode);
    setPurchasePrice(data.purchase_price?.toString() || "");
    setPrice(data.price.toString());
    setWholesalePrice(data.wholesale_price?.toString() || "");
    setWholesaleThreshold(data.wholesale_threshold?.toString() || "");
    setStock(data.stock.toString());
    setCategory(data.category);
    setImagePreview(data.image_url);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let imageUrl = imagePreview;

      // Upload image if new file selected
      if (imageFile) {
        const fileExt = imageFile.name.split(".").pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(filePath, imageFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("product-images")
          .getPublicUrl(filePath);

        imageUrl = urlData.publicUrl;
      }

      const productData = {
        name,
        barcode,
        purchase_price: parseFloat(purchasePrice),
        price: parseFloat(price),
        wholesale_price: wholesalePrice ? parseFloat(wholesalePrice) : null,
        wholesale_threshold: wholesaleThreshold ? parseInt(wholesaleThreshold) : null,
        stock: parseInt(stock),
        category,
        image_url: imageUrl,
      };

      if (isEdit) {
        const { error } = await supabase
          .from("products")
          .update(productData)
          .eq("id", productId);

        if (error) throw error;

        toast({
          title: "Produk Diperbarui",
          description: "Produk berhasil diperbarui",
        });
      } else {
        const { error } = await supabase.from("products").insert(productData);

        if (error) throw error;

        toast({
          title: "Produk Ditambahkan",
          description: "Produk berhasil ditambahkan",
        });
      }

      navigate("/admin/products");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate("/admin/products")}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-3xl font-bold text-foreground">
          {isEdit ? "Edit Produk" : "Tambah Produk Baru"}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informasi Produk</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Produk *</Label>
                <Input
                  id="name"
                  placeholder="Contoh: Indomie Goreng"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="barcode">Barcode *</Label>
                <Input
                  id="barcode"
                  placeholder="Contoh: 8992388101046"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="purchasePrice">Harga Beli per Pcs *</Label>
                <Input
                  id="purchasePrice"
                  type="number"
                  placeholder="Contoh: 2500"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                  required
                  min="0"
                  step="1"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Harga Satuan per Pcs *</Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="Contoh: 3500"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                  min="0"
                  step="1"
                />
              </div>

              {isPriceWarning && (
                <div className="md:col-span-2">
                  <Alert variant="destructive" className="border-warning bg-warning/10">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                    <AlertDescription className="text-warning">
                      Peringatan: Harga beli lebih besar dari harga satuan. Anda akan mengalami kerugian pada produk ini.
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="wholesalePrice">Harga Grosir per Pcs</Label>
                <Input
                  id="wholesalePrice"
                  type="number"
                  placeholder="Contoh: 3000 (opsional)"
                  value={wholesalePrice}
                  onChange={(e) => setWholesalePrice(e.target.value)}
                  min="0"
                  step="1"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="wholesaleThreshold">Lipatan (Min. Pembelian Grosir)</Label>
                <Input
                  id="wholesaleThreshold"
                  type="number"
                  placeholder="Contoh: 10 untuk minimal 10 pcs"
                  value={wholesaleThreshold}
                  onChange={(e) => setWholesaleThreshold(e.target.value)}
                  min="1"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="stock">Stok *</Label>
                <Input
                  id="stock"
                  type="number"
                  placeholder="Contoh: 100"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  required
                  min="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Kategori *</Label>
                <Select value={category} onValueChange={setCategory} required>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.name}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="image">Gambar Produk</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => document.getElementById("image")?.click()}
                  >
                    <Upload className="w-4 h-4" />
                  </Button>
                </div>
                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full max-w-xs h-48 object-cover rounded-md border mt-2"
                  />
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/admin/products")}
                disabled={loading}
              >
                Batal
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Menyimpan..." : isEdit ? "Perbarui Produk" : "Simpan Produk"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductFormPage;