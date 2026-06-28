<script setup lang="ts">
import { computed, type HTMLAttributes } from 'vue'
import {
  SelectContent,
  type SelectContentEmits,
  type SelectContentProps,
  SelectPortal,
  SelectViewport,
  useForwardPropsEmits
} from 'reka-ui'
import { cn } from '@renderer/lib/utils'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<SelectContentProps & { class?: HTMLAttributes['class'] }>(),
  {
    position: 'popper'
  }
)
const emits = defineEmits<SelectContentEmits>()

const delegatedProps = computed(() => {
  const { class: _class, ...delegated } = props
  return delegated
})

const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <SelectPortal>
    <SelectContent
      v-bind="{ ...forwarded, ...$attrs }"
      :class="
        cn(
          'bg-popover text-popover-foreground relative z-50 max-h-96 min-w-32 overflow-hidden rounded-md border shadow-md',
          props.class
        )
      "
    >
      <SelectViewport class="p-1">
        <slot />
      </SelectViewport>
    </SelectContent>
  </SelectPortal>
</template>
