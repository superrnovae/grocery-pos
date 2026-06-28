import { type VariantProps, cva } from 'class-variance-authority'

export { default as ToggleGroup } from './ToggleGroup.vue'
export { default as ToggleGroupItem } from './ToggleGroupItem.vue'

export const toggleVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium hover:bg-muted hover:text-muted-foreground disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none transition-[color,box-shadow]',
  {
    variants: {
      variant: {
        default: 'bg-transparent',
        outline:
          'border border-input bg-transparent shadow-xs hover:bg-accent hover:text-accent-foreground'
      },
      size: {
        default: 'h-9 px-3 min-w-9',
        sm: 'h-8 px-2.5 min-w-8',
        lg: 'h-10 px-4 min-w-10'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
)

export type ToggleGroupVariants = VariantProps<typeof toggleVariants>
