<template>
  <v-app id="app">
    <v-main>
      <ChatWindow />
    </v-main>
  </v-app>
</template>

<style>

#app {
  width: 350px;
  max-height: 500px;
  min-height: fit-content;
}

</style>

<script>
import ChatWindow from './components/ChatWindow.vue';

export default {
  name: 'App',

  components: {
    ChatWindow,
  },

  data: () => ({
    //
  }),
}
</script>
