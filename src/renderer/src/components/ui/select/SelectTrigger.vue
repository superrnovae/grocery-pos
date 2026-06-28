<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { ChevronDown } from '@lucide/vue'
import { SelectIcon, SelectTrigger, type SelectTriggerProps } from 'reka-ui'
import { cn } from '@renderer/lib/utils'

const props = defineProps<SelectTriggerProps & { class?: HTMLAttributes['class'] }>()
</script>

<template>
  <SelectTrigger
    v-bind="props"
    :class="
      cn(
        'border-input data-[placeholder]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 flex h-9 w-fit items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50',
        props.class
      )
    "
  >
    <slot />
    <SelectIcon as-child>
      <ChevronDown class="size-4 opacity-50" />
    </SelectIcon>
  </SelectTrigger>
</template>
