document.getElementById("content").style.display = "none";
document.body.classList.add('hidden-overflow');
window.addEventListener("load", function () {
    document.getElementById("spinner-body").style.display = "none";
    document.body.classList.remove('hidden-overflow');
    document.getElementById("content").style.display = "block";
  });


  