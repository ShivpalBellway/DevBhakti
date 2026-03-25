import React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Minus, Plus, Trash2, IndianRupee, ShoppingBag } from "lucide-react";

import { useCart, CartItem } from "@/context/CartContext";
import { BASE_URL, API_URL } from "@/config/apiConfig";

interface CartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CartItem[];
  onUpdateQuantity: (variantId: string, quantity: number) => void;
  onRemoveItem: (variantId: string) => void;
  onCheckout: () => void;
}

const CartDrawer: React.FC<CartDrawerProps> = ({
  open,
  onOpenChange,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
}) => {
  const [platformFee, setPlatformFee] = React.useState(0);
  const [isCalculating, setIsCalculating] = React.useState(false);


  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  React.useEffect(() => {
    const fetchFees = async () => {
      if (items.length === 0) {
        setPlatformFee(0);
        return;
      }
      setIsCalculating(true);
      try {
        const response = await fetch(`${API_URL}/orders/calculate-fees`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: items.map(item => ({
              productId: item.productId,
              price: item.price,
              quantity: item.quantity,
              templeId: item.templeId,
              sellerId: (item as any).sellerId
            }))
          })
        });
        const data = await response.json();
        if (data.success) {
          setPlatformFee(data.totalPlatformFee);
        }
      } catch (error) {
        console.error("Fee calculation error:", error);
      } finally {
        setIsCalculating(false);
      }
    };

    if (open) {
      fetchFees();
    }
  }, [items, open, API_URL]);

  const total = subtotal + platformFee;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col bg-[#fdf6e9] border-[#794A05]/10">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 font-display text-[#2a1b01]">
            <ShoppingBag className="h-5 w-5 text-[#794A05]" />
            Your Sacred Cart ({items.length} items)
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-4 scrollbar-thin scrollbar-thumb-[#794A05]/20">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <div className="w-20 h-20 bg-[#794A05]/5 rounded-full flex items-center justify-center mb-4">
                <ShoppingBag className="h-10 w-10 text-[#794A05]/40" />
              </div>
              <p className="text-xl font-display font-bold text-[#2a1b01] mb-2">Your cart is empty</p>
              <p className="text-slate-500 mb-8">Add some sacred items to start your spiritual journey</p>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                
                className="rounded-full border-[#794A05]/20 bg-[#794A05] text-white hover:bg-[#794A05] hover:text-white hover:shadow-none hover:opacity-100"
              >
                Start Exploring
              </Button>
            </div>
          ) : (
            <div className="space-y-4 px-1">
              {items.map((item) => (
                <div key={item.variantId} className="flex gap-4 p-4 bg-white rounded-2xl border border-[#794A05]/5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-20 h-20 rounded-xl overflow-hidden shadow-inner bg-slate-50 flex-shrink-0">
                    <img
                      src={item.image.startsWith('http') ? item.image : `${BASE_URL}${item.image}`}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-[#2a1b01] truncate text-sm">{item.name}</h4>
                      <p className="text-[10px] text-slate-500 line-clamp-1">{item.variantName}</p>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <p className="flex items-center text-[#794A05] font-bold">
                        <IndianRupee className="h-3.5 w-3.5" />
                        {item.price}
                      </p>
                      <div className="flex items-center gap-3 bg-slate-50 rounded-full px-2 py-1 border border-slate-100">
                        <button
                          onClick={() => onUpdateQuantity(item.variantId, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="w-6 h-6 flex items-center justify-center rounded-full text-slate-400 hover:text-[#794A05] disabled:opacity-30"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-4 text-center text-xs font-bold text-[#2a1b01]">{item.quantity}</span>
                        <button
                          onClick={() => onUpdateQuantity(item.variantId, item.quantity + 1)}
                          className="w-6 h-6 flex items-center justify-center rounded-full text-slate-400 hover:text-[#794A05]"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => onRemoveItem(item.variantId)}
                    className="self-start p-1.5 text-slate-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <SheetFooter className="flex-col gap-4 sm:flex-col p-6 bg-white border-t border-[#794A05]/10 rounded-t-3xl shadow-[0_-8px_30px_rgb(0,0,0,0.04)]">
            <div className="w-full space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Subtotal</span>
                <span className="flex items-center font-bold text-[#2a1b01]">
                  <IndianRupee className="h-3.5 w-3.5" />
                  {subtotal.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Platform Service Fee</span>
                <span className="flex items-center font-bold text-[#794A05]">
                  {isCalculating ? (
                    <span className="text-[10px] animate-pulse">Calculating...</span>
                  ) : (
                    <><IndianRupee className="h-3.5 w-3.5" /> {platformFee.toLocaleString()}</>
                  )}
                </span>
              </div>
              <div className="flex justify-between text-xs text-slate-400 italic">
                <span>Shipping</span>
                <span>Calculated at checkout</span>
              </div>
              <Separator className="bg-[#794A05]/10" />
              <div className="flex justify-between items-end pt-1">
                <span className="font-bold text-[#2a1b01]">Order Total</span>
                <span className="flex items-center font-black text-2xl text-[#794A05]">
                  <IndianRupee className="h-5 w-5" />
                  {total.toLocaleString()}
                </span>
              </div>
            </div>
            <Button
              className="w-full h-14 rounded-2xl bg-[#794A05] hover:bg-[#5d3804] text-white font-bold text-lg shadow-lg shadow-[#794A05]/20 group"
              onClick={onCheckout}
            >
              Checkout Now
              <Plus className="ml-2 h-5 w-5 rotate-45 group-hover:rotate-0 transition-transform" />
            </Button>
            <p className="text-[10px] text-center text-slate-400">Secure payments powered by DevBhakti SafePay</p>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default CartDrawer;
