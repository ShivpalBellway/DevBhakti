"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Plus, Trash2, Sparkles, Building2, MapPin, Check, AlertCircle, X, Store, Banknote, Clock, User, Phone, Mail } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function TempleRegistrationForm({ onClose }: { onClose?: () => void }) {
    const [poojas, setPoojas] = useState([{ name: "", price: "", duration: "" }])
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [showSuccess, setShowSuccess] = useState(false)
    const [formData, setFormData] = useState({
        templeName: "",
        deity: "",
        category: "",
        openTime: "",
        description: "",
        city: "",
        state: "",
        website: "",
        mapUrl: "",
        address: "",
        contactName: "",
        contactPhone: "",
        contactEmail: ""
    })
    const [errors, setErrors] = useState<Record<string, string>>({})
    const { toast } = useToast()

    const addPooja = () => {
        setPoojas([...poojas, { name: "", price: "", duration: "" }])
        toast({
            title: "Service added",
            description: "You can now add details for this pooja service",
        })
    }

    const removePooja = (index: number) => {
        setPoojas(poojas.filter((_, i) => i !== index))
        toast({
            title: "Service removed",
            description: "The pooja service has been removed",
        })
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target
        setFormData(prev => ({ ...prev, [id]: value }))
        if (errors[id]) {
            setErrors(prev => ({ ...prev, [id]: "" }))
        }
    }

    const validateForm = () => {
        const newErrors: Record<string, string> = {}

        if (!formData.templeName) newErrors.templeName = "Temple name is required"
        if (!formData.deity) newErrors.deity = "Main deity is required"
        if (!formData.category) newErrors.category = "Category is required"
        if (!formData.openTime) newErrors.openTime = "Opening hours are required"
        if (!formData.description) newErrors.description = "Description is required"
        if (!formData.city) newErrors.city = "City is required"
        if (!formData.state) newErrors.state = "State is required"
        if (!formData.address) newErrors.address = "Address is required"
        if (!formData.contactName) newErrors.contactName = "Contact person name is required"
        if (!formData.contactPhone) newErrors.contactPhone = "Phone number is required"

        const hasValidPooja = poojas.some(p => p.name && p.price && p.duration)
        if (!hasValidPooja) newErrors.poojas = "At least one complete pooja service is required"

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateForm()) {
            toast({
                title: "Validation Error",
                description: "Please fill in all required fields",
                variant: "destructive"
            })
            return
        }

        setIsSubmitting(true)

        setTimeout(() => {
            setIsSubmitting(false)
            setShowSuccess(true)
            toast({
                title: "Registration Successful!",
                description: "Your temple has been registered successfully. Our team will review and contact you soon.",
            })
        }, 2000)
    }

    return (
        <div className="w-full max-w-4xl mx-auto font-sans">
            {/* Success Modal */}
            <AnimatePresence>
                {showSuccess && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-[60] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm rounded-3xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-card w-full max-w-md p-8 rounded-2xl shadow-warm border border-border text-center"
                        >
                            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Sparkles className="w-10 h-10 text-primary animate-pulse" />
                            </div>
                            <h3 className="text-3xl font-serif font-bold text-foreground mb-3">Divine Welcome!</h3>
                            <p className="text-muted-foreground mb-8">
                                Your temple registration has been submitted successfully to DevBhakti. May this be the beginning of a sacred digital journey.
                            </p>
                            <Button
                                onClick={() => {
                                    setShowSuccess(false)
                                    if (onClose) onClose()
                                }}
                                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12 text-lg font-medium shadow-soft"
                            >
                                Continue to Dashboard
                            </Button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <form onSubmit={handleSubmit}>
                <Card className="border-0 shadow-none bg-card/95 backdrop-blur-xl overflow-hidden flex flex-col max-h-[90vh]">
                    {/* Header */}
                    <div className="relative bg-gradient-sacred p-8 shrink-0">
                        <div className="absolute inset-0 pattern-sacred opacity-10"></div>
                        <div className="relative z-10 flex justify-between items-start">
                            <div>
                                <h2 className="text-2xl md:text-3xl font-serif font-bold text-white flex items-center gap-3">
                                    <Building2 className="w-8 h-8 opacity-90" />
                                    Register Your Temple
                                </h2>
                                <p className="text-white/90 mt-2 font-medium">Join the Divine Digital Network</p>
                            </div>
                            {onClose && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={onClose}
                                    className="text-white/80 hover:text-white hover:bg-white/20 rounded-full h-10 w-10 transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </Button>
                            )}
                        </div>
                    </div>

                    <CardContent className="p-8 space-y-8 overflow-y-auto custom-scrollbar flex-grow">
                        {/* Section 1: Basic Info */}
                        <div className="space-y-6">
                            <h3 className="text-xl font-serif font-semibold text-foreground flex items-center gap-3 pb-3 border-b border-border">
                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-bold shadow-sm">1</span>
                                Temple Details
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2.5">
                                    <Label htmlFor="templeName" className="text-foreground/80">Temple Name</Label>
                                    <Input
                                        id="templeName"
                                        placeholder="e.g. Shree Siddhivinayak Temple"
                                        value={formData.templeName}
                                        onChange={handleInputChange}
                                        className={`bg-background h-11 focus:ring-primary/20 ${errors.templeName ? 'border-destructive ring-destructive/20' : ''}`}
                                    />
                                    {errors.templeName && <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.templeName}</p>}
                                </div>
                                <div className="space-y-2.5">
                                    <Label htmlFor="deity" className="text-foreground/80">Main Deity</Label>
                                    <Input
                                        id="deity"
                                        placeholder="e.g. Lord Ganesha"
                                        value={formData.deity}
                                        onChange={handleInputChange}
                                        className={`bg-background h-11 focus:ring-primary/20 ${errors.deity ? 'border-destructive ring-destructive/20' : ''}`}
                                    />
                                    {errors.deity && <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.deity}</p>}
                                </div>
                                <div className="space-y-2.5">
                                    <Label htmlFor="category" className="text-foreground/80">Category</Label>
                                    <div className="relative">
                                        <Sparkles className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="category"
                                            placeholder="e.g. Shiva, Vishnu, Devi"
                                            value={formData.category}
                                            onChange={handleInputChange}
                                            className={`pl-10 bg-background h-11 focus:ring-primary/20 ${errors.category ? 'border-destructive ring-destructive/20' : ''}`}
                                        />
                                    </div>
                                    {errors.category && <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.category}</p>}
                                </div>
                                <div className="space-y-2.5">
                                    <Label htmlFor="openTime" className="text-foreground/80">Opening Hours</Label>
                                    <div className="relative">
                                        <Clock className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="openTime"
                                            placeholder="e.g. 5:00 AM - 10:00 PM"
                                            value={formData.openTime}
                                            onChange={handleInputChange}
                                            className={`pl-10 bg-background h-11 focus:ring-primary/20 ${errors.openTime ? 'border-destructive ring-destructive/20' : ''}`}
                                        />
                                    </div>
                                    {errors.openTime && <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.openTime}</p>}
                                </div>
                                <div className="col-span-1 md:col-span-2 space-y-2.5">
                                    <Label htmlFor="description" className="text-foreground/80">About the Temple</Label>
                                    <Textarea
                                        id="description"
                                        placeholder="Share the history, significance, and divine energy of this sacred place..."
                                        className={`min-h-[100px] bg-background resize-none focus:ring-primary/20 ${errors.description ? 'border-destructive ring-destructive/20' : ''}`}
                                        value={formData.description}
                                        onChange={handleInputChange}
                                    />
                                    {errors.description && <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.description}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Location */}
                        <div className="space-y-6">
                            <h3 className="text-xl font-serif font-semibold text-foreground flex items-center gap-3 pb-3 border-b border-border">
                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-bold shadow-sm">2</span>
                                Sacred Location
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2.5">
                                    <Label htmlFor="city" className="text-foreground/80">City</Label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="city"
                                            className={`pl-10 bg-background h-11 focus:ring-primary/20 ${errors.city ? 'border-destructive ring-destructive/20' : ''}`}
                                            placeholder="e.g. Varanasi"
                                            value={formData.city}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    {errors.city && <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.city}</p>}
                                </div>
                                <div className="space-y-2.5">
                                    <Label htmlFor="state" className="text-foreground/80">State</Label>
                                    <Input
                                        id="state"
                                        placeholder="e.g. Uttar Pradesh"
                                        value={formData.state}
                                        onChange={handleInputChange}
                                        className={`bg-background h-11 focus:ring-primary/20 ${errors.state ? 'border-destructive ring-destructive/20' : ''}`}
                                    />
                                    {errors.state && <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.state}</p>}
                                </div>
                                <div className="col-span-1 md:col-span-2 space-y-2.5">
                                    <Label htmlFor="address" className="text-foreground/80">Full Address</Label>
                                    <Textarea
                                        id="address"
                                        placeholder="Complete street address, pincode, and landmarks..."
                                        className={`h-20 bg-background resize-none focus:ring-primary/20 ${errors.address ? 'border-destructive ring-destructive/20' : ''}`}
                                        value={formData.address}
                                        onChange={handleInputChange}
                                    />
                                    {errors.address && <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.address}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Services */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between pb-3 border-b border-border">
                                <h3 className="text-xl font-serif font-semibold text-foreground flex items-center gap-3">
                                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-bold shadow-sm">3</span>
                                    Poojas & Services
                                </h3>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={addPooja}
                                    className="h-9 border-primary/20 hover:bg-primary/5 hover:text-primary transition-colors text-foreground font-medium"
                                >
                                    <Plus className="w-4 h-4 mr-2" /> Add Service
                                </Button>
                            </div>

                            <div className="space-y-4">
                                {errors.poojas && (
                                    <p className="text-sm text-destructive flex items-center gap-2 bg-destructive/10 p-3 rounded-lg">
                                        <AlertCircle className="w-4 h-4" />
                                        {errors.poojas}
                                    </p>
                                )}
                                <AnimatePresence>
                                    {poojas.map((_, index) => (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, height: 0, y: -10 }}
                                            animate={{ opacity: 1, height: "auto", y: 0 }}
                                            exit={{ opacity: 0, height: 0, y: -10 }}
                                            className="bg-muted/30 p-5 rounded-xl border border-border relative group hover:shadow-sm transition-all duration-300"
                                        >
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                                <div className="md:col-span-2 space-y-2">
                                                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pooja Name</Label>
                                                    <div className="relative">
                                                        <Store className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                        <Input placeholder="e.g. Rudrabhishek" className="pl-9 bg-background h-10 border-border" />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Duration</Label>
                                                    <div className="relative">
                                                        <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                        <Input placeholder="e.g. 2 hrs" className="pl-9 bg-background h-10 border-border" />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Offering (₹)</Label>
                                                    <div className="relative">
                                                        <Banknote className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                        <Input placeholder="1100" className="pl-9 bg-background h-10 border-border" />
                                                    </div>
                                                </div>
                                            </div>
                                            {poojas.length > 1 && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => removePooja(index)}
                                                    className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            )}
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Section 4: Contact */}
                        <div className="space-y-6">
                            <h3 className="text-xl font-serif font-semibold text-foreground flex items-center gap-3 pb-3 border-b border-border">
                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-bold shadow-sm">4</span>
                                Contact Details
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2.5">
                                    <Label htmlFor="contactName" className="text-foreground/80">Contact Person</Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="contactName"
                                            placeholder="Name of authorized person"
                                            className={`pl-10 bg-background h-11 focus:ring-primary/20 ${errors.contactName ? 'border-destructive ring-destructive/20' : ''}`}
                                            value={formData.contactName}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    {errors.contactName && <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.contactName}</p>}
                                </div>
                                <div className="space-y-2.5">
                                    <Label htmlFor="contactPhone" className="text-foreground/80">Phone Number</Label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="contactPhone"
                                            placeholder="+91..."
                                            className={`pl-10 bg-background h-11 focus:ring-primary/20 ${errors.contactPhone ? 'border-destructive ring-destructive/20' : ''}`}
                                            value={formData.contactPhone}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    {errors.contactPhone && <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.contactPhone}</p>}
                                </div>
                                <div className="col-span-1 md:col-span-2 space-y-2.5">
                                    <Label htmlFor="contactEmail" className="text-foreground/80">Email Address (Optional)</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="contactEmail"
                                            placeholder="temple.admin@example.com"
                                            className="pl-10 bg-background h-11 focus:ring-primary/20"
                                            value={formData.contactEmail}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                    </CardContent>

                    <CardFooter className="p-6 bg-muted/20 border-t border-border flex justify-end gap-4 shrink-0">
                        {onClose && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onClose}
                                disabled={isSubmitting}
                                className="h-11 px-6 border-border font-medium text-muted-foreground hover:text-foreground hover:bg-muted"
                            >
                                Cancel
                            </Button>
                        )}
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground h-11 px-8 font-semibold shadow-warm transition-all hover:scale-[1.02]"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent"></div>
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4 mr-2" />
                                    Complete Registration
                                </>
                            )}
                        </Button>
                    </CardFooter>
                </Card>
            </form>
        </div>
    )
}
