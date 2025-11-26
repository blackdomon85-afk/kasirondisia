import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Search, ScanBarcode, Printer, Home, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface Product {
  id: string;
  name: string;
  price: number;
  barcode: string;
}

interface CartItem extends Product {
  quantity: number;
}

const MOCK_PRODUCTS: Product[] = [
  { id: "1", name: "Indomie Goreng", price: 3500, barcode: "8888001234567" },
  { id: "2", name: "Aqua 600ml", price: 3000, barcode: "8888001234568" },
  { id: "3", name: "Teh Pucuk", price: 4000, barcode: "8888001234569" },
  { id: "4", name: "Kopi Kapal Api", price: 2500, barcode: "8888001234570" },
  { id: "5", name: "Susu Ultra 250ml", price: 5500, barcode: "8888001234571" },
];

const Kasir = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [barcodeInput, setBarcodeInput] = useState("");
  const [cashReceived, setCashReceived] = useState("");

  const addToCart = (product: Product) => {
    const existingItem = cart.find((item) => item.id === product.id);
    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
    toast({
      title: "Produk ditambahkan",
      description: `${product.name} ditambahkan ke keranjang`,
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.id !== productId));
  };

  const handleBarcodeSearch = () => {
    const product = MOCK_PRODUCTS.find((p) => p.barcode === barcodeInput);
    if (product) {
      addToCart(product);
      setBarcodeInput("");
    } else {
      toast({
        title: "Produk tidak ditemukan",
        description: "Barcode tidak valid",
        variant: "destructive",
      });
    }
  };

  const filteredProducts = MOCK_PRODUCTS.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const total = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const change = cashReceived ? parseInt(cashReceived) - total : 0;

  const handlePrint = () => {
    if (cart.length === 0) {
      toast({
        title: "Keranjang kosong",
        description: "Tambahkan produk terlebih dahulu",
        variant: "destructive",
      });
      return;
    }
    if (!cashReceived || parseInt(cashReceived) < total) {
      toast({
        title: "Uang tidak cukup",
        description: "Masukkan jumlah uang yang diterima",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Transaksi berhasil",
      description: "Nota akan dicetak (simulasi)",
    });
    
    // Reset form
    setCart([]);
    setCashReceived("");
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-foreground">Kasir POS</h1>
          <Button variant="outline" onClick={() => navigate("/")}>
            <Home className="w-4 h-4 mr-2" />
            Kembali
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Scan / Cari Produk</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Masukkan barcode..."
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleBarcodeSearch()}
                  />
                  <Button onClick={handleBarcodeSearch}>
                    <ScanBarcode className="w-4 h-4 mr-2" />
                    Scan
                  </Button>
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari produk..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 max-h-80 overflow-y-auto">
                  {filteredProducts.map((product) => (
                    <Card
                      key={product.id}
                      className="cursor-pointer hover:border-primary transition-colors"
                      onClick={() => addToCart(product)}
                    >
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-foreground mb-1">
                          {product.name}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          {product.barcode}
                        </p>
                        <p className="text-lg font-bold text-primary">
                          Rp {product.price.toLocaleString("id-ID")}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Keranjang</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {cart.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Keranjang kosong
                    </p>
                  ) : (
                    cart.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between items-center p-3 bg-secondary rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-foreground">
                            {item.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {item.quantity} x Rp{" "}
                            {item.price.toLocaleString("id-ID")}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-foreground">
                            Rp {(item.price * item.quantity).toLocaleString("id-ID")}
                          </p>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFromCart(item.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex justify-between text-lg">
                    <span className="font-medium">Total:</span>
                    <span className="font-bold text-primary">
                      Rp {total.toLocaleString("id-ID")}
                    </span>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Uang Diterima
                    </label>
                    <Input
                      type="number"
                      placeholder="Masukkan jumlah uang..."
                      value={cashReceived}
                      onChange={(e) => setCashReceived(e.target.value)}
                    />
                  </div>

                  {cashReceived && parseInt(cashReceived) >= total && (
                    <div className="flex justify-between text-lg p-3 bg-success/10 rounded-lg">
                      <span className="font-medium text-success-foreground">Kembalian:</span>
                      <span className="font-bold text-success">
                        Rp {change.toLocaleString("id-ID")}
                      </span>
                    </div>
                  )}

                  <Button className="w-full" size="lg" onClick={handlePrint}>
                    <Printer className="w-4 h-4 mr-2" />
                    Cetak Nota
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Kasir;
