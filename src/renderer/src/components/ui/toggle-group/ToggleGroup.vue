<script setup lang="ts">
import { computed, provide, type HTMLAttributes } from 'vue'
import {
  ToggleGroupRoot,
  type ToggleGroupRootEmits,
  type ToggleGroupRootProps,
  useForwardPropsEmits
} from 'reka-ui'
import { cn } from '@renderer/lib/utils'
import { type ToggleGroupVariants } from '.'

const props = defineProps<
  ToggleGroupRootProps & {
    class?: HTMLAttributes['class']
    variant?: ToggleGroupVariants['variant']
    size?: ToggleGroupVariants['size']
  }
>()
const emits = defineEmits<ToggleGroupRootEmits>()

provide('toggleGroup', {
  variant: props.variant,
  size: props.size
})

const delegatedProps = computed(() => {
  const { class: _class, variant: _variant, size: _size, ...delegated } = props
  return delegated
})

const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <ToggleGroupRoot
    v-bind="forwarded"
    :data-variant="variant"
    :data-size="size"
    :class="cn('flex w-fit items-center gap-1', props.class)"
  >
    <slot />
  </ToggleGroupRoot>
</template>
