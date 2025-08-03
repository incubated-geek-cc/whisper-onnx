import * as React from 'react'
import * as SliderPrimitive from '@radix-ui/react-slider'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

// const Slider = React.forwardRef<
//   React.ElementRef<typeof SliderPrimitive.Root>,
//   React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> & VariantProps<typeof sliderVariants>
// >(({ className, ...props }, ref) => (
//   <SliderPrimitive.Root
//     ref={ref}
//     className={cn(
//       'relative flex w-full touch-none select-none items-center',
//       className
//     )}
//     {...props}
//   >
//     <SliderPrimitive.Track className="relative h-2.5 w-full grow overflow-hidden rounded-full border-2 border-primary bg-white">
//       <SliderPrimitive.Range className={cn(sliderVariants({ variant }), className)} />
//     </SliderPrimitive.Track>
//     <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
//   </SliderPrimitive.Root>
// ))
// Slider.displayName = SliderPrimitive.Root.displayName

// export { Slider }

const sliderRangeVariants = cva(
  'absolute h-full',
  {
    variants: {
      variant: {
        default: 'bg-primary',
        orange: 'bg-orange-700',
        amber: 'bg-amber-700',
        yellow: 'bg-yellow-700',
        lime: 'bg-lime-700',
        green: 'bg-green-700',
        emerald: 'bg-emerald-700',
        teal: 'bg-teal-700',
        cyan: 'bg-cyan-700',
        sky: 'bg-sky-700',
        blue: 'bg-blue-700',
        indigo: 'bg-indigo-700',
      },
    },
    defaultVariants: {
      variant: 'default'
    }
  }
)

const sliderThumbVariants = cva(
  'block h-5 w-5 rounded-full border-2 ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'border-primary bg-white',
        orange: 'border-primary bg-orange-700',
        amber: 'border-primary bg-amber-700',
        yellow: 'border-primary bg-yellow-700',
        lime: 'border-primary bg-lime-700',
        green: 'border-primary bg-green-700',
        emerald: 'border-primary bg-emerald-700',
        teal: 'border-primary bg-teal-700',
        cyan: 'border-primary bg-cyan-700',
        sky: 'border-primary bg-sky-700',
        blue: 'border-primary bg-blue-700',
        indigo: 'border-primary bg-indigo-700'
      }
    },
    defaultVariants: {
      variant: 'default'
    },
  }
)

export interface SliderProps
  extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>,
    VariantProps<typeof sliderRangeVariants> {}

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  SliderProps
>(({ className, variant, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      'relative flex w-full touch-none select-none items-center',
      className
    )}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-2.5 w-full grow overflow-hidden rounded-full border-2 border-primary bg-white">
      <SliderPrimitive.Range className={sliderRangeVariants({ variant })} />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className={sliderThumbVariants({ variant })} />
  </SliderPrimitive.Root>
))
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }