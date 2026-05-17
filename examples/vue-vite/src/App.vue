<script setup lang="ts">
import ExamplePanel from './components/ExamplePanel.vue'

const metrics = [
  { label: 'Component stack', value: 'Vue runtime' },
  { label: 'Selector path', value: 'DOM target' },
  { label: 'Style rules', value: 'CSS matches' },
]
</script>

<template>
  <main class="example-shell">
    <section class="hero-section" id="example-hero">
      <p class="eyebrow">ui-context-grab example</p>
      <h1>Vue Vite integration</h1>
      <p class="intro">
        Use the floating trigger, then click the panels below to inspect DOM,
        component, and style context in the console.
      </p>
    </section>

    <section class="metric-grid" aria-label="Collected context examples">
      <article
        v-for="metric in metrics"
        :key="metric.label"
        class="metric-card"
      >
        <span class="metric-label">{{ metric.label }}</span>
        <strong>{{ metric.value }}</strong>
      </article>
    </section>

    <ExamplePanel />
  </main>
</template>
