"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Wallet,
  Plus,
  Search,
  Download,
  Filter,
  Trash2,
  Edit,
  Eye,
  Calendar,
  DollarSign,
  User,
  CreditCard,
  FileText,
  X,
  CheckCircle2,
  RefreshCw,
  Upload,
  Paperclip,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import {
  fetchMandalExpenses,
  fetchMandalExpenseCategories,
  createMandalExpenseCategory,
  createMandalExpense,
  updateMandalExpense,
  deleteMandalExpense,
  uploadMandalExpenseReceipt,
  fetchMandalStaff
} from "@/api/mandalAdminController";

export default function MandalExpensesListPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedPaymentMode, setSelectedPaymentMode] = useState("ALL");
  const [paidByNameFilter, setPaidByNameFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<any>(null);

  const handleOpenViewModal = (exp: any) => {
    setSelectedExpense(exp);
    setIsViewModalOpen(true);
  };

  // Form state
  const [formData, setFormData] = useState({
    amount: "",
    categoryId: "",
    description: "",
    expenseDate: new Date().toISOString().split("T")[0],
    paymentMode: "CASH",
    paidByName: "",
    paidByMemberId: "",
    receiptImage: "",
    notes: ""
  });
  const [isPaidByOther, setIsPaidByOther] = useState(false);
  const [customPaidByName, setCustomPaidByName] = useState("");
  const [isCategoryOther, setIsCategoryOther] = useState(false);
  const [customCategoryName, setCustomCategoryName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    setErrorMsg("");
    try {
      const res = await uploadMandalExpenseReceipt(file);
      if (res.success && res.url) {
        setFormData(prev => ({ ...prev, receiptImage: res.url }));
      } else {
        setErrorMsg(res.message || "File upload failed");
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || "Failed to upload receipt file");
    } finally {
      setUploadingFile(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [expRes, catRes, staffRes] = await Promise.all([
        fetchMandalExpenses({
          search,
          categoryId: selectedCategory,
          paymentMode: selectedPaymentMode,
          paidByName: paidByNameFilter,
          startDate,
          endDate
        }),
        fetchMandalExpenseCategories(),
        fetchMandalStaff()
      ]);

      if (expRes.success) {
        setExpenses(expRes.data.expenses || []);
        setTotal(expRes.data.total || 0);
      }

      if (catRes.success) {
        setCategories(catRes.data || []);
      }

      if (staffRes.success) {
        setStaffList(staffRes.data || []);
      }
    } catch (error) {
      console.error("Failed to load expenses data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, selectedCategory, selectedPaymentMode, paidByNameFilter, startDate, endDate]);

  const handleOpenAddModal = () => {
    setFormData({
      amount: "",
      categoryId: categories[0]?.id || "",
      description: "",
      expenseDate: new Date().toISOString().split("T")[0],
      paymentMode: "CASH",
      paidByName: "",
      paidByMemberId: "",
      receiptImage: "",
      notes: ""
    });
    setIsPaidByOther(false);
    setCustomPaidByName("");
    setIsCategoryOther(false);
    setCustomCategoryName("");
    setErrorMsg("");
    setSuccessMsg("");
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (exp: any) => {
    setSelectedExpense(exp);
    setFormData({
      amount: exp.amount ? String(exp.amount) : "",
      categoryId: exp.categoryId || "",
      description: exp.description || "",
      expenseDate: exp.expenseDate ? new Date(exp.expenseDate).toISOString().split("T")[0] : "",
      paymentMode: exp.paymentMode || "CASH",
      paidByName: exp.paidByName || "",
      paidByMemberId: exp.paidByMemberId || "",
      receiptImage: exp.receiptImage || "",
      notes: exp.notes || ""
    });

    const isMemberInList = staffList.some((st) => st.name === exp.paidByName);
    if (!isMemberInList && exp.paidByName) {
      setIsPaidByOther(true);
      setCustomPaidByName(exp.paidByName);
    } else {
      setIsPaidByOther(false);
      setCustomPaidByName("");
    }

    const isCatInList = categories.some((c) => c.id === exp.categoryId);
    if (!isCatInList && exp.categoryId) {
      setIsCategoryOther(true);
      setCustomCategoryName(exp.categoryName || "");
    } else {
      setIsCategoryOther(false);
      setCustomCategoryName("");
    }

    setErrorMsg("");
    setSuccessMsg("");
    setIsEditModalOpen(true);
  };

  const handleOpenDeleteModal = (exp: any) => {
    setSelectedExpense(exp);
    setIsDeleteModalOpen(true);
  };

  const handleSubmitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || Number(formData.amount) <= 0) {
      setErrorMsg("Amount must be greater than zero");
      return;
    }
    if (!formData.expenseDate) {
      setErrorMsg("Expense date is required");
      return;
    }
    if (!isCategoryOther && !formData.categoryId) {
      setErrorMsg("Please select an expense category");
      return;
    }
    if (isCategoryOther && !customCategoryName.trim()) {
      setErrorMsg("Please enter new category name");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");
    try {
      let finalCategoryId = formData.categoryId;

      if (isCategoryOther) {
        const catRes = await createMandalExpenseCategory({ name: customCategoryName.trim() });
        if (catRes.success && catRes.data?.id) {
          finalCategoryId = catRes.data.id;
        } else {
          setErrorMsg(catRes.message || "Failed to create expense category");
          setSubmitting(false);
          return;
        }
      }

      const payload = {
        ...formData,
        categoryId: finalCategoryId,
        paidByName: isPaidByOther ? customPaidByName.trim() : formData.paidByName,
      };

      const res = await createMandalExpense(payload);
      if (res.success) {
        setSuccessMsg("Expense recorded successfully!");
        setTimeout(() => {
          setIsAddModalOpen(false);
          loadData();
        }, 800);
      } else {
        setErrorMsg(res.message || "Failed to create expense");
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExpense) return;

    if (!isCategoryOther && !formData.categoryId) {
      setErrorMsg("Please select an expense category");
      return;
    }
    if (!formData.expenseDate) {
      setErrorMsg("Expense date is required");
      return;
    }
    if (isCategoryOther && !customCategoryName.trim()) {
      setErrorMsg("Please enter new category name");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");
    try {
      let finalCategoryId = formData.categoryId;

      if (isCategoryOther) {
        const catRes = await createMandalExpenseCategory({ name: customCategoryName.trim() });
        if (catRes.success && catRes.data?.id) {
          finalCategoryId = catRes.data.id;
        } else {
          setErrorMsg(catRes.message || "Failed to create expense category");
          setSubmitting(false);
          return;
        }
      }

      const payload = {
        ...formData,
        categoryId: finalCategoryId,
        paidByName: isPaidByOther ? customPaidByName.trim() : formData.paidByName,
      };

      const res = await updateMandalExpense(selectedExpense.id, payload);
      if (res.success) {
        setSuccessMsg("Expense updated successfully!");
        setTimeout(() => {
          setIsEditModalOpen(false);
          loadData();
        }, 800);
      } else {
        setErrorMsg(res.message || "Failed to update expense");
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedExpense) return;
    setSubmitting(true);
    try {
      const res = await deleteMandalExpense(selectedExpense.id);
      if (res.success) {
        setIsDeleteModalOpen(false);
        loadData();
      }
    } catch (err) {
      console.error("Delete expense error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (expenses.length === 0) return;
    const headers = ["ID", "Date", "Category", "Amount", "Description", "Paid By", "Payment Mode", "Entered By", "Notes"];
    const rows = expenses.map(e => [
      e.id,
      new Date(e.expenseDate).toLocaleDateString(),
      `"${e.categoryName}"`,
      e.amount,
      `"${e.description.replace(/"/g, '""')}"`,
      `"${e.paidByName}"`,
      e.paymentMode,
      `"${e.enteredByName}"`,
      `"${(e.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `mandal_expenses_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-6 rounded-2xl border border-border shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">
            <Wallet className="w-4 h-4" /> All Expense Records
          </div>
          <h1 className="text-2xl font-bold font-serif text-foreground">Mandal Expenses List</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Search, filter, edit, delete, and export all recorded operational expenses.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleExportCSV} variant="outline" className="border-amber-300 text-amber-900 hover:bg-amber-50">
            <Download className="w-4 h-4 mr-2" /> Export Excel/CSV
          </Button>
          <Button onClick={handleOpenAddModal} className="bg-amber-700 hover:bg-amber-800 text-white font-semibold">
            <Plus className="w-4 h-4 mr-2" /> Add Expense
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="border-amber-200/60 shadow-sm">
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
              <Input
                placeholder="Search description, paid by, notes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Category Filter */}
            <div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="ALL">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Payment Mode Filter */}
            <div>
              <select
                value={selectedPaymentMode}
                onChange={(e) => setSelectedPaymentMode(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="ALL">All Payment Modes</option>
                <option value="CASH">Cash</option>
                <option value="UPI">UPI</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            {/* Paid By Filter */}
            <div>
              <Input
                placeholder="Paid By member name..."
                value={paidByNameFilter}
                onChange={(e) => setPaidByNameFilter(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/50 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-muted-foreground">Date Range:</span>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-8 text-xs w-36"
              />
              <span>to</span>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-8 text-xs w-36"
              />
              {(startDate || endDate) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setStartDate(""); setEndDate(""); }}
                  className="h-8 text-xs text-rose-600"
                >
                  Clear Dates
                </Button>
              )}
            </div>
            <div className="text-muted-foreground font-medium">
              Showing {expenses.length} of {total} expense records
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expenses Table */}
      <Card className="border-amber-200/60 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-amber-100/60 text-amber-900 border-b border-amber-200 uppercase text-[11px] font-bold">
              <tr>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Description / Note</th>
                <th className="py-1 px-3">Enter by </th>
                <th className="py-3.5 px-4">Paid By (Spent By)</th>
                <th className="py-3.5 px-4">Mode</th>
                <th className="py-3.5 px-4 text-right">Amount</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted-foreground">
                    Loading expenses...
                  </td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    <p className="font-medium">No expenses found matching your criteria.</p>
                    <p className="text-xs mt-1">Click "+ Add Expense" above to record a new payment.</p>
                  </td>
                </tr>
              ) : (
                expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-amber-50/40 transition-colors">
                    <td className="py-3 px-4 font-medium text-foreground whitespace-nowrap">
                      {new Date(exp.expenseDate).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric"
                      })}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-900">
                        {exp.categoryName}
                      </span>
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <p className="font-semibold text-foreground truncate">{exp.description}</p>
                      {exp.notes && <p className="text-xs text-muted-foreground truncate">{exp.notes}</p>}
                      {exp.receiptImage && (
                        <div className="mt-1">
                          <a
                            href={exp.receiptImage}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-100/90 hover:bg-amber-200 px-2 py-0.5 rounded border border-amber-300 transition-colors"
                            title="View Attached Bill / Receipt"
                          >
                            {exp.receiptImage.toLowerCase().endsWith(".pdf") ? (
                              <>
                                <FileText className="w-3 h-3 text-rose-600" /> PDF Bill
                              </>
                            ) : (
                              <>
                                <Paperclip className="w-3 h-3 text-amber-800" /> View Receipt
                              </>
                            )}
                            <ExternalLink className="w-2.5 h-2.5 ml-0.5 opacity-70" />
                          </a>
                        </div>
                      )}
                    </td>

                     <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800 border">
                      {exp.enteredByName}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 font-medium text-foreground">
                        <User className="w-3.5 h-3.5 text-amber-700" />
                        <span>{exp.paidByName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800 border">
                        {exp.paymentMode}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-rose-700 whitespace-nowrap">
                      ₹{exp.amount.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenViewModal(exp)}
                          className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                          title="View Expense Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEditModal(exp)}
                          className="h-8 w-8 text-amber-700 hover:bg-amber-100"
                          title="Edit Expense"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDeleteModal(exp)}
                          className="h-8 w-8 text-rose-600 hover:bg-rose-100"
                          title="Delete Expense"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ADD EXPENSE MODAL */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl font-bold text-amber-900 flex items-center gap-2">
              <Plus className="w-5 h-5" /> Record Mandal Expense
            </DialogTitle>
            <DialogDescription className="text-xs">
              Ensure you record who actually paid for this expense on behalf of the Mandal.
            </DialogDescription>
          </DialogHeader>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-lg flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmitCreate} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-foreground">
                  Expense Amount (₹) <span className="text-rose-600 font-bold">*</span>
                </label>
                <Input
                  type="number"
                  placeholder="e.g. 2500"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-foreground">
                  Expense Category <span className="text-rose-600 font-bold">*</span>
                </label>
                <select
                  value={isCategoryOther ? "OTHER" : formData.categoryId}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "OTHER") {
                      setIsCategoryOther(true);
                      setFormData(prev => ({ ...prev, categoryId: "" }));
                    } else {
                      setIsCategoryOther(false);
                      setCustomCategoryName("");
                      setFormData(prev => ({ ...prev, categoryId: val }));
                    }
                  }}
                  required={!isCategoryOther}
                  className="mt-1 w-full h-10 px-3 rounded-md border border-input bg-background text-sm font-medium"
                >
                  <option value="">-- Select Category --</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                  <option value="OTHER">Other</option>
                </select>

                {isCategoryOther && (
                  <div className="mt-2">
                    <label className="text-[11px] font-semibold text-muted-foreground">
                      New Category Name <span className="text-rose-600 font-bold">*</span>
                    </label>
                    <Input
                      type="text"
                      placeholder="Enter new category name (e.g. Decoration2)"
                      value={customCategoryName}
                      onChange={(e) => setCustomCategoryName(e.target.value)}
                      required
                      className="mt-1"
                    />
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-foreground">Description  (Optional)</label>
              <Input
                placeholder="e.g. Flowers for daily Ganesh pooja"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-foreground">Spent By / Paid By Member (Optional)</label>
                {staffList.length > 0 ? (
                  <div className="space-y-1.5">
                    <select
                      value={isPaidByOther ? "OTHER" : formData.paidByName}
                      onChange={(e) => {
                        const selectedVal = e.target.value;
                        if (selectedVal === "OTHER") {
                          setIsPaidByOther(true);
                          setFormData(prev => ({
                            ...prev,
                            paidByName: customPaidByName,
                            paidByMemberId: ""
                          }));
                        } else {
                          setIsPaidByOther(false);
                          const selectedStaff = staffList.find((st) => st.name === selectedVal);
                          setFormData(prev => ({
                            ...prev,
                            paidByName: selectedVal,
                            paidByMemberId: selectedStaff ? selectedStaff.id : ""
                          }));
                        }
                      }}
                      className="mt-1 w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                    >
                      <option value="">-- Select Staff Member --</option>
                      {staffList.map((st) => (
                        <option key={st.id} value={st.name}>
                          {st.name} {st.roleName ? `(${st.roleName})` : ""}
                        </option>
                      ))}
                      <option value="OTHER">Other / Enter Name Manually</option>
                    </select>
                    {isPaidByOther && (
                      <Input
                        placeholder="Enter member / person name..."
                        value={customPaidByName}
                        onChange={(e) => {
                          const nameVal = e.target.value;
                          setCustomPaidByName(nameVal);
                          setFormData(prev => ({ ...prev, paidByName: nameVal, paidByMemberId: "" }));
                        }}
                        className="mt-1"
                        required
                      />
                    )}
                  </div>
                ) : (
                  <Input
                    placeholder="e.g. Ramesh Patil (Treasurer)"
                    value={formData.paidByName}
                    onChange={(e) => setFormData({ ...formData, paidByName: e.target.value })}
                    className="mt-1"
                  />
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-foreground">Payment Mode</label>
                <select
                  value={formData.paymentMode}
                  onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}
                  className="mt-1 w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                >
                  <option value="CASH">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-foreground">
                  Expense Date <span className="text-rose-600 font-bold">*</span>
                </label>
                <Input
                  type="date"
                  value={formData.expenseDate}
                  onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-foreground flex items-center justify-between">
                  <span>Bill / Receipt (Image or PDF)</span>
                  <span className="text-[10px] text-muted-foreground font-normal">Max 10MB</span>
                </label>
                <div className="mt-1 space-y-1.5">
                  {formData.receiptImage ? (
                    <div className="flex items-center justify-between p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs">
                      <div className="flex items-center gap-2 overflow-hidden mr-1">
                        {formData.receiptImage.toLowerCase().endsWith(".pdf") ? (
                          <div className="px-1.5 py-0.5 bg-rose-100 text-rose-700 rounded font-bold text-[10px] flex items-center gap-1 shrink-0">
                            <FileText className="w-3.5 h-3.5" /> PDF
                          </div>
                        ) : (
                          <div className="w-7 h-7 rounded border overflow-hidden shrink-0 bg-slate-100">
                            <img src={formData.receiptImage} alt="Receipt" className="w-full h-full object-cover" />
                          </div>
                        )}
                        <span className="truncate text-amber-950 font-medium text-[11px]">{formData.receiptImage.split('/').pop()}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <a
                          href={formData.receiptImage}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 text-amber-800 hover:bg-amber-100 rounded"
                          title="View File"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, receiptImage: "" })}
                          className="p-1 text-rose-600 hover:bg-rose-100 rounded"
                          title="Remove File"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="flex items-center justify-center gap-1.5 border border-dashed border-amber-300 hover:border-amber-500 bg-amber-50/50 hover:bg-amber-50 p-2 rounded-lg cursor-pointer transition-colors text-xs font-medium text-amber-900 h-10">
                      {uploadingFile ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-700" />
                      ) : (
                        <Upload className="w-3.5 h-3.5 text-amber-700" />
                      )}
                      <span className="text-[11px]">{uploadingFile ? "Uploading..." : "Upload Image or PDF"}</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,application/pdf"
                        onChange={handleFileUpload}
                        disabled={uploadingFile}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>

            {/* <div>
              <label className="text-xs font-bold text-foreground">Additional Notes (Optional)</label>
              <Input
                placeholder="Bill receipt #104..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="mt-1"
              />
            </div> */}

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="bg-amber-700 hover:bg-amber-800 text-white">
                {submitting ? "Saving..." : "Save Expense"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* EDIT EXPENSE MODAL */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl font-bold text-amber-900 flex items-center gap-2">
              <Edit className="w-5 h-5" /> Edit Expense Entry
            </DialogTitle>
          </DialogHeader>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-lg flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmitUpdate} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-foreground">
                  Expense Amount (₹) <span className="text-rose-600 font-bold">*</span>
                </label>
                <Input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-foreground">
                  Expense Category <span className="text-rose-600 font-bold">*</span>
                </label>
                <select
                  value={isCategoryOther ? "OTHER" : formData.categoryId}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "OTHER") {
                      setIsCategoryOther(true);
                      setFormData(prev => ({ ...prev, categoryId: "" }));
                    } else {
                      setIsCategoryOther(false);
                      setCustomCategoryName("");
                      setFormData(prev => ({ ...prev, categoryId: val }));
                    }
                  }}
                  required={!isCategoryOther}
                  className="mt-1 w-full h-10 px-3 rounded-md border border-input bg-background text-sm font-medium"
                >
                  <option value="">-- Select Category --</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                  <option value="OTHER">Other</option>
                </select>

                {isCategoryOther && (
                  <div className="mt-2">
                    <label className="text-[11px] font-semibold text-muted-foreground">
                      New Category Name <span className="text-rose-600 font-bold">*</span>
                    </label>
                    <Input
                      type="text"
                      placeholder="Enter new category name (e.g. Decoration2)"
                      value={customCategoryName}
                      onChange={(e) => setCustomCategoryName(e.target.value)}
                      required
                      className="mt-1"
                    />
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-foreground">Description  (Optional)</label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-foreground">Spent By / Paid By Member (Optional)</label>
                {staffList.length > 0 ? (
                  <div className="space-y-1.5">
                    <select
                      value={isPaidByOther ? "OTHER" : formData.paidByName}

                      onChange={(e) => {
                        const selectedVal = e.target.value;
                        if (selectedVal === "OTHER") {
                          setIsPaidByOther(true);
                          setFormData(prev => ({
                            ...prev,
                            paidByName: customPaidByName,
                            paidByMemberId: ""
                          }));
                        } else {
                          setIsPaidByOther(false);
                          const selectedStaff = staffList.find((st) => st.name === selectedVal);
                          setFormData(prev => ({
                            ...prev,
                            paidByName: selectedVal,
                            paidByMemberId: selectedStaff ? selectedStaff.id : ""
                          }));
                        }
                      }}
                      className="mt-1 w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                    >
                      <option value="">-- Select Staff Member --</option>
                      {staffList.map((st) => (
                        <option key={st.id} value={st.name}>
                          {st.name} {st.roleName ? `(${st.roleName})` : ""}
                        </option>
                      ))}
                      <option value="OTHER">Other / Enter Name Manually</option>
                    </select>
                    {isPaidByOther && (
                      <Input
                        placeholder="Enter member / person name..."
                        value={customPaidByName}
                        onChange={(e) => {
                          const nameVal = e.target.value;
                          setCustomPaidByName(nameVal);
                          setFormData(prev => ({ ...prev, paidByName: nameVal, paidByMemberId: "" }));
                        }}
                        className="mt-1"
                        required
                      />
                    )}
                  </div>
                ) : (
                  <Input
                    placeholder="e.g. Ramesh Patil (Treasurer)"
                    value={formData.paidByName}
                    onChange={(e) => setFormData({ ...formData, paidByName: e.target.value })}
                    className="mt-1"
                  />
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-foreground">Payment Mode</label>
                <select
                  value={formData.paymentMode}
                  onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}
                  className="mt-1 w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                >
                  <option value="CASH">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-foreground">
                  Expense Date <span className="text-rose-600 font-bold">*</span>
                </label>
                <Input
                  type="date"
                  value={formData.expenseDate}
                  onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-foreground flex items-center justify-between">
                  <span>Bill / Receipt (Image or PDF)</span>
                  <span className="text-[10px] text-muted-foreground font-normal">Max 10MB</span>
                </label>
                <div className="mt-1 space-y-1.5">
                  {formData.receiptImage ? (
                    <div className="flex items-center justify-between p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs">
                      <div className="flex items-center gap-2 overflow-hidden mr-1">
                        {formData.receiptImage.toLowerCase().endsWith(".pdf") ? (
                          <div className="px-1.5 py-0.5 bg-rose-100 text-rose-700 rounded font-bold text-[10px] flex items-center gap-1 shrink-0">
                            <FileText className="w-3.5 h-3.5" /> PDF
                          </div>
                        ) : (
                          <div className="w-7 h-7 rounded border overflow-hidden shrink-0 bg-slate-100">
                            <img src={formData.receiptImage} alt="Receipt" className="w-full h-full object-cover" />
                          </div>
                        )}
                        <span className="truncate text-amber-950 font-medium text-[11px]">{formData.receiptImage.split('/').pop()}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <a
                          href={formData.receiptImage}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 text-amber-800 hover:bg-amber-100 rounded"
                          title="View File"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, receiptImage: "" })}
                          className="p-1 text-rose-600 hover:bg-rose-100 rounded"
                          title="Remove File"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="flex items-center justify-center gap-1.5 border border-dashed border-amber-300 hover:border-amber-500 bg-amber-50/50 hover:bg-amber-50 p-2 rounded-lg cursor-pointer transition-colors text-xs font-medium text-amber-900 h-10">
                      {uploadingFile ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-700" />
                      ) : (
                        <Upload className="w-3.5 h-3.5 text-amber-700" />
                      )}
                      <span className="text-[11px]">{uploadingFile ? "Uploading..." : "Upload Image or PDF"}</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,application/pdf"
                        onChange={handleFileUpload}
                        disabled={uploadingFile}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>
{/* 
            <div>
              <label className="text-xs font-bold text-foreground">Additional Notes</label>
              <Input
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="mt-1"
              />
            </div> */}

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="bg-amber-700 hover:bg-amber-800 text-white">
                {submitting ? "Updating..." : "Update Expense"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* VIEW EXPENSE DETAILS MODAL */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg font-bold text-amber-900 flex items-center gap-2">
              <Eye className="w-5 h-5 text-blue-600" /> Expense Details
            </DialogTitle>
          </DialogHeader>

          {selectedExpense && (
            <div className="space-y-4 pt-2 text-sm">
              <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl border border-amber-200">
                <div>
                  <span className="text-xs text-muted-foreground block">Amount Spent</span>
                  <span className="text-2xl font-bold text-rose-700">₹{selectedExpense.amount?.toLocaleString("en-IN")}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-muted-foreground block">Payment Mode</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-800 border">
                    {selectedExpense.paymentMode}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-muted-foreground font-semibold block">Category:</span>
                  <span className="font-bold text-amber-950">{selectedExpense.categoryName}</span>
                </div>
                <div>
                  <span className="text-muted-foreground font-semibold block">Expense Date:</span>
                  <span className="font-medium">
                    {new Date(selectedExpense.expenseDate).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric"
                    })}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground font-semibold block">Paid By (Spent By):</span>
                  <span className="font-bold text-slate-900">{selectedExpense.paidByName}</span>
                </div>
                <div>
                  <span className="text-muted-foreground font-semibold block">Recorded By:</span>
                  <span className="font-medium">{selectedExpense.enteredByName}</span>
                </div>
              </div>

              <div>
                <span className="text-xs text-muted-foreground font-semibold block mb-0.5">Description:</span>
                <p className="p-2.5 bg-muted/40 rounded-lg text-xs font-medium text-foreground border border-border/50">
                  {selectedExpense.description}
                </p>
              </div>

              {selectedExpense.notes && (
                <div>
                  <span className="text-xs text-muted-foreground font-semibold block mb-0.5">Additional Notes:</span>
                  <p className="p-2 bg-muted/30 rounded-lg text-xs text-muted-foreground italic border border-border/30">
                    {selectedExpense.notes}
                  </p>
                </div>
              )}

              {selectedExpense.receiptImage && (
                <div>
                  <span className="text-xs text-muted-foreground font-semibold block mb-1">Bill / Receipt:</span>
                  <a
                    href={selectedExpense.receiptImage}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2.5 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-300 text-amber-950 text-xs font-semibold transition-colors"
                  >
                    <span className="flex items-center gap-2 truncate">
                      {selectedExpense.receiptImage.toLowerCase().endsWith(".pdf") ? (
                        <>
                          <FileText className="w-4 h-4 text-rose-600 shrink-0" /> PDF Bill Attachment
                        </>
                      ) : (
                        <>
                          <Paperclip className="w-4 h-4 text-amber-800 shrink-0" /> View Receipt Image
                        </>
                      )}
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-70 shrink-0" />
                  </a>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="pt-3">
            <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION MODAL */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg font-bold text-rose-700 flex items-center gap-2">
              <Trash2 className="w-5 h-5" /> Confirm Deletion
            </DialogTitle>
            <DialogDescription className="text-xs pt-2">
              Are you sure you want to delete the expense entry for <strong>"{selectedExpense?.description}"</strong> (₹{selectedExpense?.amount})? This will be permanently removed from financial reports.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-4">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleDeleteConfirm} disabled={submitting} className="bg-rose-600 hover:bg-rose-700 text-white">
              {submitting ? "Deleting..." : "Delete Entry"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
