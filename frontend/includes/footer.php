  <!-- Global context injection from PHP Session -->
  <script>
    const CURRENT_USER = <?php echo $user ? json_encode($user) : 'null'; ?>;
  </script>

  <!-- Main JS Application Logic -->
  <script src="js/app.js"></script>
</body>
</html>
