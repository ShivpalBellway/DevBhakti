"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Sparkles, Building2, X, LogIn, Mail, Lock, Eye, EyeOff, AlertCircle, Phone } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function TempleLoginModal({ onClose }: { onClose: () => void }) {
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [formData, setFormData] = useState({
        number: "",
        password: ""
    })
    const [errors, setErrors] = useState<Record<string, string>>({})
    const { toast } = useToast()

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target
        setFormData(prev => ({ ...prev, [id]: value }))
        if (errors[id]) {
            setErrors(prev => ({ ...prev, [id]: "" }))
        }
    }

    const validateForm = () => {
        const newErrors: Record<string, string> = {}
        if (!formData.number) newErrors.number = "Number is required"
        else if (!/\S+@\S+\.\S+/.test(formData.number)) newErrors.number = "Invalid number format"

        if (!formData.password) newErrors.password = "Password is required"

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validateForm()) return

        setIsSubmitting(true)
        // Simulate API call
        setTimeout(() => {
            setIsSubmitting(false)
            toast({
                title: "Login Successful",
                description: "Welcome back to your temple dashboard!",
            })
            onClose()
            router.push("/institution")
        }, 1500)
    }

    return (
        <div className="w-full max-w-md mx-auto font-sans">
            <form onSubmit={handleSubmit}>
                <Card className="border-0 shadow-2xl bg-card/95 backdrop-blur-xl overflow-hidden flex flex-col">
                    {/* Header */}
                    <div className="relative bg-gradient-sacred p-8 shrink-0">
                        <div className="absolute inset-0 pattern-sacred opacity-10"></div>
                        <div className="relative z-10 flex justify-between items-start">
                            <div>
                                <h2 className="text-2xl md:text-3xl font-serif font-bold text-white flex items-center gap-3">
                                    <Building2 className="w-8 h-8 opacity-90" />
                                    Temple Login
                                </h2>
                                <p className="text-white/90 mt-2 font-medium">Access your divine dashboard</p>
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={onClose}
                                className="text-white/80 hover:text-white hover:bg-white/20 rounded-full h-10 w-10 transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </Button>
                        </div>
                    </div>

                    <CardContent className="p-8 space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2.5">
                                <Label htmlFor="number" className="text-foreground/80">Mobile Number</Label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="number"
                                        type="number"
                                        placeholder="98765xxxx0"
                                        value={formData.number}
                                        onChange={handleInputChange}
                                        className={`pl-10 bg-background h-12 focus:ring-primary/20 ${errors.number ? 'border-destructive ring-destructive/20' : ''}`}
                                    />
                                </div>
                                {errors.number && <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.number}</p>}
                            </div>

                            <div className="space-y-2.5">
                                <div className="flex justify-between items-center">
                                    <Label htmlFor="password" className="text-foreground/80">Password</Label>
                                    <button type="button" className="text-xs text-primary hover:underline font-medium">Forgot password?</button>
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        className={`pl-10 pr-10 bg-background h-12 focus:ring-primary/20 ${errors.password ? 'border-destructive ring-destructive/20' : ''}`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-3.5 text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                {errors.password && <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.password}</p>}
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <input type="checkbox" id="remember" className="rounded border-border text-primary focus:ring-primary/20" />
                            <label htmlFor="remember" className="text-sm text-muted-foreground">Remember this temple</label>
                        </div>
                    </CardContent>

                    <CardFooter className="p-8 pt-0 flex flex-col gap-4">
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12 text-lg font-semibold shadow-warm transition-all hover:scale-[1.02]"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent"></div>
                                    Authenticating...
                                </>
                            ) : (
                                <>
                                    <LogIn className="w-5 h-5 mr-2" />
                                    Login to Dashboard
                                </>
                            )}
                        </Button>

                        {/* <div className="text-center text-sm text-muted-foreground">
                            Don't have a temple account?{" "}
                            <button type="button" className="text-primary font-bold hover:underline">Register Now</button>
                        </div> */}
                    </CardFooter>
                </Card>
            </form>
        </div>
    )
}
