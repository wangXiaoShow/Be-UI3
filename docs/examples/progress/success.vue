<template>
  <be-progress percent="80" status="normal" :success="{percent:50,color:'#00ffff'}">
  </be-progress>
  <div style="display: flex">
    <be-progress type="circle" percent="80" status="normal" :success="{percent:50,color:'#00ffff'}">
    </be-progress>
    <be-progress type="dashboard" percent="80" status="normal" :success="{percent:50,color:'#00ffff'}">
    </be-progress>
  </div>

</template>

