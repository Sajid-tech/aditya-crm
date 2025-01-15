import Page from "@/app/dashboard/page";
import React, { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, MinusCircle, Settings2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useCurrentYear } from "@/app/hooks/useCurrentYear";
import { getTodayDate } from "@/utils/currentDate";
import { ProgressBar } from "@/components/spinner/ProgressBar";
import CreateCustomer from "@/app/customer/CreateCustomer";
import CreateProduct from "@/app/product/CreateProduct";

// Validation Schemas
const productRowSchema = z.object({
  enquirySub_product_name: z.string().min(1, "Product name is required"),
  enquirySub_product_code: z.string().optional(),
  enquirySub_shu: z.string().optional(),
  enquirySub_asta: z.string().optional(),
  enquirySub_qlty_type: z.string().optional(),
  enquirySub_stem_type: z.string().optional(),
  enquirySub_course_type: z.string().optional(),
  enquirySub_moist_value: z.string().optional(),
  enquirySub_qnty: z.string().optional(),
  enquirySub_quoted_price: z.string().optional(),
  enquirySub_final_price: z.number().optional(),
  enquirySub_p2b_blend: z.string().optional(),
});

const enquiryFormSchema = z.object({
  customer_id: z.string().min(1, "Customer is required"),
  enquiry_date: z.string().min(1, "Enquiry date is required"),
  packing_type: z.string().optional(),
  marking: z.string().optional(),
  special_instruction: z.string().optional(),
  customer_feedback: z.string().optional(),
  enquiry_year: z.string().optional(),
  sample_required: z.enum(["Yes", "No"]),
  enquiry_data: z
    .array(productRowSchema)
    .min(1, "At least one product is required"),
});

// API functions

const fetchCustomers = async () => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No authentication token found");

  const response = await fetch(
    "https://adityaspice.com/app/public/api/panel-fetch-customer",
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) throw new Error("Failed to fetch customer data");
  return response.json();
};

const fetchProducts = async () => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No authentication token found");

  const response = await fetch(
    "https://adityaspice.com/app/public/api/panel-fetch-product",
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) throw new Error("Failed to fetch product data");
  return response.json();
};

const createEnquiry = async (data) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No authentication token found");

  const response = await fetch(
    "https://adityaspice.com/app/public/api/panel-create-enquiry-sample",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) throw new Error("Failed to create enquiry");
  return response.json();
};

// Header Component
const EnquiryHeader = ({ progress, year }) => {
  return (
    <div className="flex sticky top-0 z-10 border border-gray-200 rounded-lg justify-between items-start gap-8 mb-2 bg-white p-4 shadow-sm">
      <div className="flex-1">
        <h1 className="text-3xl font-bold text-gray-800">
          Sample Enquiry Form
        </h1>
        <p className="text-gray-600 mt-2">
          Create your sample enquiries:&nbsp;{year}
        </p>
      </div>

      <div className="flex-1 pt-2">
        <div className="sticky top-4">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium">Basic Details</span>
            <span className="text-sm font-medium">Products</span>
            <span className="text-sm font-medium">Requirements</span>
          </div>

          <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
            <div
              className="bg-yellow-500 h-full rounded-full transition-all duration-300 shadow-sm"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex justify-between items-center mt-2">
            <span className="text-sm font-medium text-gray-600">Progress</span>
            <span className="text-sm font-medium text-yellow-600">
              {progress}% Complete
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const SampleEnquiryCreate = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const { data: currentYear } = useCurrentYear();

  const [visibleColumns, setVisibleColumns] = useState([
    "enquirySub_product_name",
    "enquirySub_shu",
    "enquirySub_asta",
    "enquirySub_qlty_type",
    "enquirySub_course_type",
    "enquirySub_qnty",
    "enquirySub_quoted_price",
  ]);

  const defaultTableHeaders = [
    { key: "enquirySub_product_name", label: "Product Name", required: true },
    { key: "enquirySub_shu", label: "SHU (in K)" },
    { key: "enquirySub_asta", label: "ASTA" },
    { key: "enquirySub_qlty_type", label: "Quality Type" },
    { key: "enquirySub_course_type", label: "Course Type" },
    { key: "enquirySub_qnty", label: "Quantity (in MT)" },
    { key: "enquirySub_quoted_price", label: "Quoted Price" },
  ];

  const optionalHeaders = [
    { key: "enquirySub_product_code", label: "Product Code" },
    { key: "enquirySub_stem_type", label: "Stem Type" },
    { key: "enquirySub_moist_value", label: "Moisture Value" },
    { key: "enquirySub_final_price", label: "Final Price" },
    { key: "enquirySub_p2b_blend", label: "P2B Blend" },
  ];

  const [enquiryData, setEnquiryData] = useState([
    {
      enquirySub_product_name: "",
      enquirySub_product_code: "",
      enquirySub_shu: "",
      enquirySub_asta: "",
      enquirySub_qlty_type: "",
      enquirySub_stem_type: "",
      enquirySub_course_type: "",
      enquirySub_moist_value: "",
      enquirySub_qnty: "",
      enquirySub_quoted_price: "",
      enquirySub_final_price: 0,
      enquirySub_p2b_blend: "",
    },
  ]);

  const { data: customerData } = useQuery({
    queryKey: ["customers"],
    queryFn: fetchCustomers,
  });

  const { data: productData } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
  });
  console.log("currentYear", currentYear);

  const [formData, setFormData] = useState({
    enquiry_year: currentYear,
    customer_id: "",
    enquiry_date: getTodayDate(),
    packing_type: "",
    marking: "",
    customer_feedback: "",
    special_instruction: "",
    sample_required: "Yes",
  });

  useEffect(() => {
    if (currentYear) {
      setFormData((prev) => ({
        ...prev,
        enquiry_year: currentYear,
      }));
    }
  }, [currentYear]);
  const createEnquiryMutation = useMutation({
    mutationFn: createEnquiry,
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Sample Enquiry created successfully",
      });
      navigate("/enquiries");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const packingTypes = ["5 Kg", "10 Kg", "15 Kg", "20 Kg", "25 Kg"];

  useEffect(() => {
    const calculateProgress = () => {
      let filledFields = 0;
      let totalFields = 0;

      // Count basic details fields
      const basicDetailsFields = [
        "customer_id",
        "enquiry_date",
        "packing_type",
      ];
      basicDetailsFields.forEach((field) => {
        totalFields++;
        if (formData[field]) filledFields++;
      });

      // Count requirements fields
      const requirementsFields = ["marking", "sample_required"];
      requirementsFields.forEach((field) => {
        totalFields++;
        if (formData[field]) filledFields++;
      });

      // Count all visible product fields for each row
      enquiryData.forEach((row) => {
        visibleColumns.forEach((columnKey) => {
          totalFields++;
          if (row[columnKey] && row[columnKey].toString().trim() !== "") {
            filledFields++;
          }
        });
      });

      const percentage = Math.round((filledFields / totalFields) * 100);
      setProgress(Math.min(percentage, 100));
    };

    calculateProgress();
  }, [formData, enquiryData, visibleColumns]);

  const handleInputChange = (e, field) => {
    let value;
    if (e.target.type === "checkbox") {
      value = e.target.checked ? "Yes" : "No";
    } else {
      value = e.target.value;
    }
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleRowDataChange = (rowIndex, field, value) => {
    const numericFields = ["enquirySub_final_price"];
    let processedValue = value;

    if (numericFields.includes(field)) {
      const sanitizedValue = value.replace(/[^\d.]/g, "");

      const decimalCount = (sanitizedValue.match(/\./g) || []).length;
      if (decimalCount > 1) {
        return;
      }

      processedValue = sanitizedValue === "" ? "" : Number(sanitizedValue);

      if (isNaN(processedValue)) {
        return;
      }
    }
    const newData = [...enquiryData];
    newData[rowIndex] = {
      ...newData[rowIndex],
      [field]: processedValue,
    };
    setEnquiryData(newData);
  };

  const toggleColumn = (columnKey) => {
    setVisibleColumns((prev) =>
      prev.includes(columnKey)
        ? prev.filter((key) => key !== columnKey)
        : [...prev, columnKey]
    );
  };

  const addRow = () => {
    setEnquiryData([
      ...enquiryData,
      {
        enquirySub_product_name: "",
        enquirySub_product_code: "",
        enquirySub_shu: "",
        enquirySub_asta: "",
        enquirySub_qlty_type: "",
        enquirySub_stem_type: "",
        enquirySub_course_type: "",
        enquirySub_moist_value: "",
        enquirySub_qnty: "",
        enquirySub_quoted_price: "",
        enquirySub_final_price: "",
        enquirySub_p2b_blend: "",
      },
    ]);
  };

  const removeRow = (index) => {
    if (enquiryData.length > 1) {
      setEnquiryData((prevData) => prevData.filter((_, i) => i !== index));
    }
  };

  const RadioOption = ({
    label,
    value,
    onChange,
    currentValue,
    required = false,
  }) => (
    <div>
      <label className="block text-sm font-medium mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <RadioGroup
        value={currentValue}
        onValueChange={(newValue) =>
          onChange({ target: { value: newValue } }, value)
        }
        className="flex gap-4"
      >
        <div className="flex items-center space-x-2 cursor-pointer">
          <RadioGroupItem value="Yes" id={`${value}-yes`} />
          <label htmlFor={`${value}-yes`} className="cursor-pointer">
            Yes
          </label>
        </div>
        <div className="flex items-center space-x-2 cursor-pointer">
          <RadioGroupItem value="No" id={`${value}-no`} />
          <label htmlFor={`${value}-no`} className="cursor-pointer">
            No
          </label>
        </div>
      </RadioGroup>
    </div>
  );
  const fieldLabels = {
    customer_id: "Customer",
    enquiry_date: "Enquiry Date",
    packing_type: "Packing Type",
    marking: "Marking",
    sample_required: "Sample Required",
    treatment_required: "Treatment Required",
    etd: "ETD",
    gama_rediations: "Gama Radiations",
    steam_sterlizaton: "Steam Sterilization",
    enquirySub_product_name: "Product Name",
    enquirySub_shu: "SHU",
    enquirySub_asta: "ASTA",
    enquirySub_qlty_type: "Quality Type",
    enquirySub_course_type: "Course Type",
    enquirySub_qnty: "Quantity",
    enquirySub_quoted_price: "Quoted Price",
    enquirySub_final_price: "Final Price",
    enquirySub_p2b_blend: "P2B Blend",
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentYear) {
      toast({
        title: "Missing Data",
        description: "Please select the current year before submitting.",
        variant: "destructive",
      });
      return;
    }

    try {
      const validatedData = enquiryFormSchema.parse({
        ...formData,
        enquiry_data: enquiryData,
      });
      createEnquiryMutation.mutate(validatedData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const groupedErrors = error.errors.reduce((acc, err) => {
          const field = err.path.join(".");
          if (!acc[field]) {
            acc[field] = [];
          }
          acc[field].push(err.message);
          return acc;
        }, {});

        const errorMessages = Object.entries(groupedErrors).map(
          ([field, messages]) => {
            const fieldKey = field.split(".").pop();
            const label = fieldLabels[fieldKey] || field;
            return `${label}: ${messages.join(", ")}`;
          }
        );

        toast({
          title: "Validation Error",
          description: (
            <div>
              <ul className="list-disc pl-5">
                {errorMessages.map((message, index) => (
                  <li key={index}>{message}</li>
                ))}
              </ul>
            </div>
          ),
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };
  return (
    <Page>
      <form onSubmit={handleSubmit} className="w-full p-4">
        <EnquiryHeader progress={progress} year={currentYear} />

        <Card className="mb-6">
          <CardContent className="p-6">
            {/* Basic Details Section */}
            <div className="mb-8">
              <div className="grid grid-cols-3 gap-6">
                <div className="hidden">
                  <label className="block text-sm font-medium mb-2">
                    Enquiry Year
                  </label>
                  <Input
                    type="text"
                    placeholder="Enter marking details"
                    value={formData.enquiry_year}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Customer <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={formData.customer_id}
                    onValueChange={(value) =>
                      handleInputChange({ target: { value } }, "customer_id")
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customerData?.customer?.map((customer) => (
                        <SelectItem
                          key={customer.id}
                          value={customer.id.toString()}
                        >
                          {customer.customer_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <CreateCustomer />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Enquiry Date <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="date"
                    value={formData.enquiry_date}
                    onChange={(e) => handleInputChange(e, "enquiry_date")}
                  />
                </div>
              </div>
            </div>

            {/* Products Section */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <div className="flex flex-row items-center">
                  <h2 className="text-xl font-semibold">Products</h2>
                  <CreateProduct />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Settings2 className="h-4 w-4 mr-2" />
                      Customize Columns
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    {optionalHeaders.map((header) => (
                      <DropdownMenuItem
                        key={header.key}
                        onClick={() => toggleColumn(header.key)}
                      >
                        <span>{header.label}</span>
                        {visibleColumns.includes(header.key) && (
                          <span className="text-green-500">✓</span>
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      {[...defaultTableHeaders, ...optionalHeaders]
                        .filter((header) => visibleColumns.includes(header.key))
                        .map((header) => (
                          <th
                            key={header.key}
                            className="p-2 text-left border text-sm font-medium"
                          >
                            {header.label}
                            {header.required && (
                              <span className="text-red-500 ml-1">*</span>
                            )}
                          </th>
                        ))}
                      <th className="p-2 text-left border">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enquiryData.map((row, rowIndex) => (
                      <tr key={rowIndex} className="border-b hover:bg-gray-50">
                        {[...defaultTableHeaders, ...optionalHeaders]
                          .filter((header) =>
                            visibleColumns.includes(header.key)
                          )
                          .map((header) => (
                            <td key={header.key} className="p-2 border">
                              {header.key === "enquirySub_product_name" ? (
                                <Select
                                  value={row[header.key]}
                                  onValueChange={(value) =>
                                    handleRowDataChange(
                                      rowIndex,
                                      header.key,
                                      value
                                    )
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select product" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {productData?.product?.map((product) => (
                                      <SelectItem
                                        key={product.id}
                                        value={product.product_name}
                                      >
                                        {product.product_name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              ) : (
                                <Input
                                  value={row[header.key]}
                                  onChange={(e) =>
                                    handleRowDataChange(
                                      rowIndex,
                                      header.key,
                                      e.target.value
                                    )
                                  }
                                  type={
                                    ["enquirySub_final_price"].includes(
                                      header.key
                                    )
                                      ? "number"
                                      : "text"
                                  }
                                  step={
                                    ["enquirySub_final_price"].includes(
                                      header.key
                                    )
                                      ? "any"
                                      : undefined
                                  }
                                  min={
                                    ["enquirySub_final_price"].includes(
                                      header.key
                                    )
                                      ? "0"
                                      : undefined
                                  }
                                  className="w-full border border-gray-300 bg-yellow-50"
                                />
                              )}
                            </td>
                          ))}
                        <td className="p-2 border">
                          <Button
                            variant="ghost"
                            onClick={() => removeRow(rowIndex)}
                            disabled={enquiryData.length === 1}
                            className="text-red-500"
                            type="button"
                          >
                            <MinusCircle className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex justify-end">
                <Button
                  type="button"
                  onClick={addRow}
                  className="bg-yellow-500 text-black hover:bg-yellow-400"
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Product
                </Button>
              </div>
            </div>

            {/* Requirements Section */}
            <div className="mb-8">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Packing Type
                  </label>
                  {/* <Select
                    value={formData.packing_type}
                    onValueChange={(value) =>
                      handleInputChange({ target: { value } }, "packing_type")
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select packing type" />
                    </SelectTrigger>
                    <SelectContent>
                      {packingTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select> */}
                  <Input
                    type="text"
                    placeholder="Enter Package details"
                    value={formData.packing_type}
                    onChange={(e) => handleInputChange(e, "packing_type")}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Marking
                  </label>
                  <Input
                    type="text"
                    placeholder="Enter marking details"
                    value={formData.marking}
                    onChange={(e) => handleInputChange(e, "marking")}
                  />
                </div>

                <RadioOption
                  label="Sample Required"
                  value="sample_required"
                  onChange={handleInputChange}
                  currentValue={formData.sample_required}
                  required={true}
                />

                {/* Conditional Treatment Options */}

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Special Instructions
                  </label>
                  <textarea
                    value={formData.special_instruction}
                    onChange={(e) =>
                      handleInputChange(e, "special_instruction")
                    }
                    placeholder="Pls enter special instruction..."
                    className="border rounded-md p-2 w-full h-24 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Customer Feedback
                  </label>
                  <textarea
                    value={formData.customer_feedback}
                    onChange={(e) => handleInputChange(e, "customer_feedback")}
                    placeholder="Pls enter customer feedback..."
                    className="border rounded-md p-2 w-full h-24 resize-none"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        {/* <div className="flex justify-end">
          <Button
            type="submit"
            className="bg-yellow-500 text-black hover:bg-yellow-400"
            disabled={createEnquiryMutation.isPending}
          >
            {createEnquiryMutation.isPending
              ? "Submitting..."
              : "Submit Enquiry"}
          </Button>
        </div> */}
        <div className="flex flex-col items-end">
          {createEnquiryMutation.isPending && <ProgressBar progress={70} />}
          <Button
            type="submit"
            className="bg-yellow-500 text-black hover:bg-yellow-400 flex items-center mt-2"
            disabled={createEnquiryMutation.isPending}
          >
            {createEnquiryMutation.isPending
              ? "Submitting..."
              : "Submit Sample Enquiry"}
          </Button>
        </div>
      </form>
    </Page>
  );
};

export default SampleEnquiryCreate;