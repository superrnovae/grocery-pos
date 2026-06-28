<script setup lang="ts">
import { computed, type HTMLAttributes } from 'vue'
import { Check } from '@lucide/vue'
import { SelectItem, SelectItemIndicator, SelectItemText, type SelectItemProps } from 'reka-ui'
import { cn } from '@renderer/lib/utils'

const props = defineProps<SelectItemProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = computed(() => {
  const { class: _class, ...delegated } = props
  return delegated
})
</script>

<template>
  <SelectItem
    v-bind="delegatedProps"
    :class="
      cn(
        'focus:bg-accent focus:text-accent-foreground relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        props.class
      )
    "
  >
    <span class="absolute right-2 flex size-3.5 items-center justify-center">
      <SelectItemIndicator>
        <Check class="size-4" />
      </SelectItemIndicator>
    </span>
    <SelectItemText>
      <slot />
    </SelectItemText>
  </SelectItem>
</template>
