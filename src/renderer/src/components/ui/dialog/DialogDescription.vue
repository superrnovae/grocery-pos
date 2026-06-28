<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { DialogDescription, type DialogDescriptionProps } from 'reka-ui'
import { cn } from '@renderer/lib/utils'

const props = defineProps<DialogDescriptionProps & { class?: HTMLAttributes['class'] }>()
</script>

<template>
  <DialogDescription v-bind="props" :class="cn('text-muted-foreground text-sm', props.class)">
    <slot />
  </DialogDescription>
</template>
