<script setup lang="ts">
import { computed, inject, type HTMLAttributes } from 'vue'
import { ToggleGroupItem, type ToggleGroupItemProps, useForwardProps } from 'reka-ui'
import { cn } from '@renderer/lib/utils'
import { toggleVariants, type ToggleGroupVariants } from '.'

const props = defineProps<
  ToggleGroupItemProps & {
    class?: HTMLAttributes['class']
    variant?: ToggleGroupVariants['variant']
    size?: ToggleGroupVariants['size']
  }
>()

const context = inject<{
  variant?: ToggleGroupVariants['variant']
  size?: ToggleGroupVariants['size']
}>('toggleGroup', {})

const delegatedProps = computed(() => {
  const { class: _class, variant: _variant, size: _size, ...delegated } = props
  return delegated
})

const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
  <ToggleGroupItem
    v-bind="forwardedProps"
    :class="
      cn(
        toggleVariants({ variant: context.variant ?? variant, size: context.size ?? size }),
        props.class
      )
    "
  >
    <slot />
  </ToggleGroupItem>
</template>
