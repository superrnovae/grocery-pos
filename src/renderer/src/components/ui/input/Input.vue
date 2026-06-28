<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@renderer/lib/utils'

defineOptions({ inheritAttrs: false })

const props = defineProps<{ class?: HTMLAttributes['class'] }>()
const modelValue = defineModel<string | number>()
</script>

<template>
  <input
    v-model="modelValue"
    v-bind="$attrs"
    :class="
      cn(
        'flex h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
        'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
        'aria-invalid:ring-destructive/20 aria-invalid:border-destructive',
        props.class
      )
    "
  />
</template>
