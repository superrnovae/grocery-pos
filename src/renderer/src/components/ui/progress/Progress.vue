<script setup lang="ts">
import { computed, type HTMLAttributes } from 'vue'
import { ProgressIndicator, ProgressRoot, type ProgressRootProps } from 'reka-ui'
import { cn } from '@renderer/lib/utils'

const props = defineProps<ProgressRootProps & { class?: HTMLAttributes['class'] }>()

const offset = computed(() => {
  const max = props.max ?? 100
  const value = props.modelValue ?? 0
  return 100 - 100 * (value / max)
})
</script>

<template>
  <ProgressRoot
    v-bind="props"
    :class="cn('bg-secondary relative h-2 w-full overflow-hidden rounded-full', props.class)"
  >
    <ProgressIndicator
      class="bg-primary h-full w-full flex-1 transition-all"
      :style="{ transform: `translateX(-${offset}%)` }"
    />
  </ProgressRoot>
</template>
