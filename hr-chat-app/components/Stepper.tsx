import { CheckCircle, Circle, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface StepperProps {
    steps: {
        label: string
        completed: boolean
        active: boolean
    }[]
}

export function Stepper({ steps }: StepperProps) {
    return (
        <div className="flex w-full justify-between mb-8">
            {steps.map((step, index) => (
                <div key={index} className="flex flex-col items-center flex-1 relative">
                    <div className="flex items-center justify-center relative z-10 bg-background">
                        {step.completed ? (
                            <CheckCircle className="h-8 w-8 text-green-500" />
                        ) : step.active ? (
                            <div className="h-8 w-8 rounded-full border-2 border-primary flex items-center justify-center text-primary font-bold">
                                {index + 1}
                            </div>
                        ) : (
                            <Circle className="h-8 w-8 text-muted-foreground" />
                        )}
                    </div>
                    <p
                        className={cn(
                            "text-xs md:text-sm mt-2 font-medium text-center absolute top-8",
                            step.active || step.completed ? "text-foreground" : "text-muted-foreground"
                        )}
                    >
                        {step.label}
                    </p>
                    {index < steps.length - 1 && (
                        <div
                            className={cn(
                                "hidden md:block absolute top-4 left-1/2 w-full h-[2px] -z-0",
                                step.completed ? "bg-green-500" : "bg-muted"
                            )}
                        />
                    )}
                </div>
            ))}
        </div>
    )
}
