<script setup lang="ts">
const actions = ['Inspect button', 'Inspect nested text', 'Inspect style match']
</script>

<template>
  <section class="example-panel" id="context-panel">
    <div class="panel-copy">
      <h2>Clickable sample area</h2>
      <p>
        This nested component gives the inspector a useful Vue component stack
        and several CSS selectors to match.
      </p>
    </div>

    <div class="action-row">
      <button
        v-for="action in actions"
        :key="action"
        class="sample-action"
        type="button"
      >
        {{ action }}
      </button>
    </div>
  </section>
</template>
