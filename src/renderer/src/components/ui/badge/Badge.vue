<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@renderer/lib/utils'
import { type BadgeVariants, badgeVariants } from '.'

const props = defineProps<{
  variant?: BadgeVariants['variant']
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <span :class="cn(badgeVariants({ variant }), props.class)">
    <slot />
  </span>
</template>
