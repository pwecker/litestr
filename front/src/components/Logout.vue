<template></template>

<script>
  export default {
    name: 'Logout',
    beforeMount() {
      this.$cookies.remove('jwt');
      this.$router.push('/')
    }
  }
</script>