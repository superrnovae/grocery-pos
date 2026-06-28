<script setup lang="ts">
import { computed, type HTMLAttributes } from 'vue'
import { Label, type LabelProps } from 'reka-ui'
import { cn } from '@renderer/lib/utils'

const props = defineProps<LabelProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = computed(() => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { class: _class, ...delegated } = props
  return delegated
})
</script>

<template>
  <Label
    v-bind="delegatedProps"
    :class="
      cn(
        'flex items-center gap-2 text-sm leading-none font-medium select-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
        props.class
      )
    "
  >
    <slot />
  </Label>
</template>
