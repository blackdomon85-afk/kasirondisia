import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload } from "lucide-react";

interface ProductFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: {
    id: string;
    name: string;
    barcode: string;
    price: number;
    stock: number;
    category: string;
    image_url: string | null;
  };
  onSuccess: () => void;
}

const CATEGORIES = [
  "Makanan",
  "Minuman",
  "Elektronik",
  "Pakaian",
  "Alat Tulis",
  "Kesehatan",
  "Lainnya",
];

const ProductForm = ({ open, onOpenChange, product, onSuccess }: ProductFormProps) => {
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
  const { toast } = useToast();

  // Update form when product changes
  useEffect(() => {
    if (product) {
      setName(product.name);
      setBarcode(product.barcode);
      setPurchasePrice((product as any).purchase_price?.toString() || "");
      setPrice(product.price.toString());
      setWholesalePrice((product as any).wholesale_price?.toString() || "");
      setWholesaleThreshold((product as any).wholesale_threshold?.toString() || "");
      setStock(product.stock.toString());
      setCategory(product.category);
      setImagePreview(product.image_url);
      setImageFile(null);
    } else {
      resetForm();
    }
  }, [product, open]);

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
      let imageUrl = product?.image_url;

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

      if (product) {
        // Update existing product
        const { error } = await supabase
          .from("products")
          .update(productData)
          .eq("id", product.id);

        if (error) throw error;

        toast({
          title: "Produk Diperbarui",
          description: "Produk berhasil diperbarui",
        });
      } else {
        // Create new product
        const { error } = await supabase.from("products").insert(productData);

        if (error) throw error;

        toast({
          title: "Produk Ditambahkan",
          description: "Produk berhasil ditambahkan",
        });
      }

      onSuccess();
      onOpenChange(false);
      resetForm();
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

  const resetForm = () => {
    setName("");
    setBarcode("");
    setPurchasePrice("");
    setPrice("");
    setWholesalePrice("");
    setWholesaleThreshold("");
    setStock("");
    setCategory("");
    setImageFile(null);
    setImagePreview(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {product ? "Edit Produk" : "Tambah Produk Baru"}
          </DialogTitle>
          <DialogDescription>
            Lengkapi form di bawah untuk {product ? "mengubah" : "menambahkan"}{" "}
            produk
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
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
                step="100"
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
                step="100"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="wholesalePrice">Harga Grosir per Pcs</Label>
              <Input
                id="wholesalePrice"
                type="number"
                placeholder="Contoh: 3000 (opsional)"
                value={wholesalePrice}
                onChange={(e) => setWholesalePrice(e.target.value)}
                min="0"
                step="100"
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
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
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
                  className="w-full h-32 object-cover rounded-md border"
                />
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                resetForm();
              }}
              disabled={loading}
            >
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Menyimpan..." : product ? "Perbarui" : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProductForm;
