import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Scan, ShoppingCart, Trash2, Printer, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

interface Product {
  id: string;
  name: string;
  barcode: string;
  purchase_price: number;
  price: number;
  wholesale_price: number | null;
  wholesale_threshold: number | null;
  stock: number;
  category: string;
  image_url: string | null;
}

interface CartItem extends Product {
  quantity: number;
  subtotal: number;
}

const Kasir = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [barcode, setBarcode] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const { toast } = useToast();
  const { signOut, user } = useAuth();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("name");

    if (error) {
      toast({
        title: "Error",
        description: "Gagal memuat produk",
        variant: "destructive",
      });
      return;
    }

    setProducts(data || []);
  };

  const handleScanBarcode = async () => {
    if (!barcode.trim()) return;

    const product = products.find((p) => p.barcode === barcode);
    
    if (!product) {
      toast({
        title: "Produk Tidak Ditemukan",
        description: "Barcode tidak terdaftar",
        variant: "destructive",
      });
      setBarcode("");
      return;
    }

    addToCart(product);
    setBarcode("");
  };

  const getApplicablePrice = (product: Product, quantity: number) => {
    // Jika ada harga grosir dan quantity mencapai threshold
    if (
      product.wholesale_price && 
      product.wholesale_threshold && 
      quantity >= product.wholesale_threshold
    ) {
      return product.wholesale_price;
    }
    return product.price;
  };

  const addToCart = (product: Product) => {
    const existingItem = cart.find((item) => item.id === product.id);

    if (existingItem) {
      if (existingItem.quantity >= product.stock) {
        toast({
          title: "Stok Tidak Cukup",
          description: `Stok ${product.name} hanya tersisa ${product.stock}`,
          variant: "destructive",
        });
        return;
      }

      const newQuantity = existingItem.quantity + 1;
      const applicablePrice = getApplicablePrice(product, newQuantity);
      
      setCart(
        cart.map((item) =>
          item.id === product.id
            ? {
                ...item,
                quantity: newQuantity,
                price: applicablePrice,
                subtotal: newQuantity * applicablePrice,
              }
            : item
        )
      );
    } else {
      const applicablePrice = getApplicablePrice(product, 1);
      setCart([
        ...cart,
        {
          ...product,
          quantity: 1,
          price: applicablePrice,
          subtotal: applicablePrice,
        },
      ]);
    }

    toast({
      title: "Produk Ditambahkan",
      description: `${product.name} ditambahkan ke keranjang`,
    });
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: string, newQuantity: number) => {
    const item = cart.find((i) => i.id === id);
    if (!item) return;

    const product = products.find((p) => p.id === id);
    if (!product) return;

    if (newQuantity > product.stock) {
      toast({
        title: "Stok Tidak Cukup",
        description: `Stok ${product.name} hanya tersisa ${product.stock}`,
        variant: "destructive",
      });
      return;
    }

    if (newQuantity <= 0) {
      removeFromCart(id);
      return;
    }

    const applicablePrice = getApplicablePrice(product, newQuantity);

    setCart(
      cart.map((item) =>
        item.id === id
          ? {
              ...item,
              quantity: newQuantity,
              price: applicablePrice,
              subtotal: newQuantity * applicablePrice,
            }
          : item
      )
    );
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const changeAmount = paymentAmount ? parseFloat(paymentAmount) - totalAmount : 0;

  const handleCheckout = async () => {
    const payment = parseFloat(paymentAmount);
    
    if (!payment || payment < totalAmount) {
      toast({
        title: "Pembayaran Tidak Valid",
        description: "Jumlah pembayaran kurang dari total belanja",
        variant: "destructive",
      });
      return;
    }

    if (cart.length === 0) {
      toast({
        title: "Keranjang Kosong",
        description: "Tambahkan produk terlebih dahulu",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create transaction
      const { data: transaction, error: transactionError } = await supabase
        .from("transactions")
        .insert({
          cashier_id: user?.id,
          total_amount: totalAmount,
          payment_amount: payment,
          change_amount: changeAmount,
        })
        .select()
        .single();

      if (transactionError) throw transactionError;

      // Create transaction items
      const transactionItems = cart.map((item) => ({
        transaction_id: transaction.id,
        product_id: item.id,
        product_name: item.name,
        product_price: item.price,
        quantity: item.quantity,
        subtotal: item.subtotal,
      }));

      const { error: itemsError } = await supabase
        .from("transaction_items")
        .insert(transactionItems);

      if (itemsError) throw itemsError;

      // Update stock
      for (const item of cart) {
        const { error: stockError } = await supabase
          .from("products")
          .update({ stock: item.stock - item.quantity })
          .eq("id", item.id);

        if (stockError) throw stockError;
      }

      toast({
        title: "Transaksi Berhasil",
        description: `Kembalian: Rp ${changeAmount.toLocaleString("id-ID")}`,
      });

      // Print receipt
      printReceipt(transaction, cart, totalAmount, payment, changeAmount);

      // Reset
      setCart([]);
      setPaymentAmount("");
      fetchProducts();
    } catch (error: any) {
      toast({
        title: "Transaksi Gagal",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.barcode.includes(searchQuery)
  );

  const printReceipt = (
    transaction: any,
    items: CartItem[],
    total: number,
    payment: number,
    change: number
  ) => {
    const printWindow = window.open("", "", "width=300,height=600");
    if (!printWindow) return;

    const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Nota Belanja</title>
        <style>
          body {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            padding: 10px;
            width: 280px;
          }
          .header {
            text-align: center;
            border-bottom: 1px dashed #000;
            padding-bottom: 10px;
            margin-bottom: 10px;
          }
          .header h2 {
            margin: 0;
            font-size: 16px;
          }
          .items {
            border-bottom: 1px dashed #000;
            padding-bottom: 10px;
            margin-bottom: 10px;
          }
          .item {
            display: flex;
            justify-content: space-between;
            margin: 5px 0;
          }
          .item-name {
            flex: 1;
          }
          .item-qty {
            width: 30px;
            text-align: center;
          }
          .item-price {
            width: 80px;
            text-align: right;
          }
          .total-section {
            margin-top: 10px;
          }
          .total-line {
            display: flex;
            justify-content: space-between;
            margin: 3px 0;
          }
          .total-line.grand {
            font-weight: bold;
            font-size: 14px;
            border-top: 1px solid #000;
            border-bottom: 1px solid #000;
            padding: 5px 0;
            margin: 5px 0;
          }
          .footer {
            text-align: center;
            margin-top: 15px;
            border-top: 1px dashed #000;
            padding-top: 10px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>TOKO SAYA</h2>
          <p style="margin: 5px 0;">Jl. Contoh No. 123</p>
          <p style="margin: 5px 0;">Telp: 021-12345678</p>
          <p style="margin: 5px 0;">${new Date().toLocaleString("id-ID")}</p>
          <p style="margin: 5px 0;">No: ${transaction.id.substring(0, 8).toUpperCase()}</p>
        </div>
        
        <div class="items">
          ${items
            .map(
              (item) => `
            <div class="item">
              <span class="item-name">${item.name}</span>
            </div>
            <div class="item">
              <span class="item-qty">${item.quantity} x</span>
              <span class="item-price">Rp ${item.price.toLocaleString("id-ID")}</span>
              <span class="item-price">Rp ${item.subtotal.toLocaleString("id-ID")}</span>
            </div>
          `
            )
            .join("")}
        </div>
        
        <div class="total-section">
          <div class="total-line grand">
            <span>TOTAL:</span>
            <span>Rp ${total.toLocaleString("id-ID")}</span>
          </div>
          <div class="total-line">
            <span>Bayar:</span>
            <span>Rp ${payment.toLocaleString("id-ID")}</span>
          </div>
          <div class="total-line">
            <span>Kembalian:</span>
            <span>Rp ${change.toLocaleString("id-ID")}</span>
          </div>
        </div>
        
        <div class="footer">
          <p>Terima Kasih</p>
          <p>Selamat Belanja Kembali</p>
        </div>
        
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() {
              window.close();
            }, 100);
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(receiptHTML);
    printWindow.document.close();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <Card className="shadow-elegant">
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  Sistem Kasir
                </h1>
                <p className="text-muted-foreground text-sm md:text-base">Point of Sale</p>
              </div>
              <Button variant="outline" onClick={signOut} className="w-full sm:w-auto">
                <LogOut className="w-4 h-4 mr-2" />
                Keluar
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Products Section */}
          <div className="lg:col-span-2 space-y-4">
            {/* Barcode Scanner */}
            <Card className="shadow-elegant hover:shadow-hover transition-all duration-300">
              <CardContent className="p-4 md:p-6">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Scan className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                    <Input
                      placeholder="Scan barcode atau ketik manual..."
                      className="pl-11 h-11 text-base border-2 focus:border-primary transition-colors"
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleScanBarcode()}
                    />
                  </div>
                  <Button 
                    onClick={handleScanBarcode}
                    className="h-11 px-6 bg-gradient-primary hover:opacity-90 transition-opacity"
                  >
                    <Scan className="w-4 h-4 mr-2" />
                    Scan
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Product Search */}
            <Card className="shadow-elegant">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Search className="w-5 h-5 text-primary" />
                  Daftar Produk
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                  <Input
                    placeholder="Cari produk..."
                    className="pl-11 h-11 text-base border-2 focus:border-primary transition-colors"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <ScrollArea className="h-[450px] md:h-[500px]">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3 md:gap-4 pr-4">
                    {filteredProducts.map((product) => (
                      <Card
                        key={product.id}
                        className="group cursor-pointer hover:shadow-hover transition-all duration-300 hover:scale-[1.02] border-2 hover:border-primary/50 overflow-hidden"
                        onClick={() => addToCart(product)}
                      >
                        <CardContent className="p-0">
                          <div className="aspect-square relative overflow-hidden bg-muted">
                            {product.image_url ? (
                              <img
                                src={product.image_url}
                                alt={product.name}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                                <ShoppingCart className="w-12 h-12 text-muted-foreground/30" />
                              </div>
                            )}
                          </div>
                          <div className="p-3 space-y-2">
                            <h3 className="font-semibold text-sm leading-tight line-clamp-2 min-h-[2.5rem]">
                              {product.name}
                            </h3>
                            <div className="space-y-1">
                              <p className="text-primary font-bold text-base">
                                Rp {product.price.toLocaleString("id-ID")}
                              </p>
                              <Badge
                                variant={product.stock < 50 ? "destructive" : "secondary"}
                                className="text-xs w-full justify-center"
                              >
                                Stok: {product.stock}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Cart Section */}
          <div className="space-y-4">
            <Card className="shadow-elegant sticky top-4">
              <CardHeader className="pb-3 bg-gradient-primary">
                <CardTitle className="flex items-center gap-2 text-primary-foreground">
                  <ShoppingCart className="w-5 h-5" />
                  Keranjang Belanja ({cart.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <ScrollArea className="h-[300px] md:h-[350px]">
                  {cart.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <ShoppingCart className="w-16 h-16 text-muted-foreground/30 mb-3" />
                      <p className="text-muted-foreground font-medium">
                        Keranjang masih kosong
                      </p>
                      <p className="text-sm text-muted-foreground/70 mt-1">
                        Tambahkan produk untuk memulai
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 pr-4">
                      {cart.map((item) => (
                        <Card key={item.id} className="border-2 hover:border-primary/30 transition-colors">
                          <CardContent className="p-3">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-semibold text-sm flex-1 leading-tight">
                                {item.name}
                              </h4>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 hover:bg-destructive/10 hover:text-destructive"
                                onClick={() => removeFromCart(item.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                            <div className="flex items-center gap-2 mb-3">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 border-2 hover:border-primary hover:bg-primary/5"
                                onClick={() =>
                                  updateQuantity(item.id, item.quantity - 1)
                                }
                              >
                                -
                              </Button>
                              <span className="text-base font-bold w-10 text-center bg-muted rounded px-2 py-1">
                                {item.quantity}
                              </span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 border-2 hover:border-primary hover:bg-primary/5"
                                onClick={() =>
                                  updateQuantity(item.id, item.quantity + 1)
                                }
                              >
                                +
                              </Button>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-muted-foreground">
                                @ Rp {item.price.toLocaleString("id-ID")}
                              </span>
                              <span className="font-bold text-primary text-base">
                                Rp {item.subtotal.toLocaleString("id-ID")}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </ScrollArea>

                <Separator className="my-4" />

                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-lg p-4 border-2 border-primary/20">
                    <div className="flex justify-between items-center">
                      <span className="text-base font-semibold">Total Belanja:</span>
                      <span className="text-2xl font-bold text-primary">
                        Rp {totalAmount.toLocaleString("id-ID")}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold flex items-center gap-2">
                      💰 Jumlah Bayar
                    </label>
                    <Input
                      type="number"
                      placeholder="Masukkan jumlah bayar..."
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="h-12 text-lg font-semibold border-2 focus:border-primary"
                    />
                  </div>

                  {paymentAmount && (
                    <div className={`rounded-lg p-3 border-2 ${
                      changeAmount < 0 
                        ? "bg-destructive/5 border-destructive/30" 
                        : "bg-success/5 border-success/30"
                    }`}>
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">Kembalian:</span>
                        <span
                          className={`text-xl font-bold ${
                            changeAmount < 0
                              ? "text-destructive"
                              : "text-success"
                          }`}
                        >
                          Rp {Math.max(0, changeAmount).toLocaleString("id-ID")}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      className="flex-1 h-12 border-2 hover:border-destructive hover:bg-destructive/5 hover:text-destructive"
                      onClick={() => {
                        setCart([]);
                        setPaymentAmount("");
                      }}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Batal
                    </Button>
                    <Button
                      className="flex-1 h-12 bg-gradient-primary hover:opacity-90 transition-opacity text-base font-semibold shadow-hover"
                      onClick={handleCheckout}
                    >
                      <Printer className="w-4 h-4 mr-2" />
                      Bayar
                    </Button>
                  </div>
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
