<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@renderer/lib/utils'

const props = defineProps<{ class?: HTMLAttributes['class'] }>()
</script>

<template>
  <div :class="cn('leading-none font-semibold', props.class)">
    <slot />
  </div>
</template>
