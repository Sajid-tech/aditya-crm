import React from 'react';
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import BASE_URL from "@/config/BaseUrl";
import { Loader2, SquarePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const CreateProduct = () => {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [productName, setProductName] = useState("");
    const { toast } = useToast();
    const queryClient = useQueryClient();
  
    const handleSubmit = async () => {
      if (!productName.trim()) {
        toast({
          title: "Error",
          description: "Product name is required",
          variant: "destructive",
        });
        return;
      }
  
      setIsLoading(true);
      try {
        const token = localStorage.getItem("token");
        await axios.post(
          `${BASE_URL}/api/panel-create-product`,
          { product_name: productName },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
  
        toast({
          title: "Success",
          description: "Product created successfully",
        });
  
        setProductName("");
        await queryClient.invalidateQueries(["products"]);
        setOpen(false);
      } catch (error) {
        toast({
          title: "Error",
          description: error.response?.data?.message || "Failed to create product",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
  return (
      <Popover open={open} onOpenChange={setOpen}>
         <PopoverTrigger asChild>
           <Button variant="default" className="ml-2 bg-yellow-500 text-black hover:bg-yellow-100">
             <SquarePlus className="h-4 w-4 mr-2" /> Product
           </Button>
         </PopoverTrigger>
         <PopoverContent className="w-80">
           <div className="grid gap-4">
             <div className="space-y-2">
               <h4 className="font-medium leading-none">Create New Product</h4>
               <p className="text-sm text-muted-foreground">
                 Enter the details for the new product
               </p>
             </div>
             <div className="grid gap-2">
               <Input
                 id="product_name"
                 placeholder="Enter product name"
                 value={productName}
                 onChange={(e) => setProductName(e.target.value)}
               />
               <Button onClick={handleSubmit} disabled={isLoading}>
                 {isLoading ? (
                   <>
                     <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                     Creating...
                   </>
                 ) : (
                   "Create Product"
                 )}
               </Button>
             </div>
           </div>
         </PopoverContent>
       </Popover>
  )
}

export default CreateProduct