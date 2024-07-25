document.getElementById("content").style.display = "none";
document.body.classList.add('hidden-overflow');
window.addEventListener("load", function () {
    document.getElementById("spinner-body").style.display = "none";
    document.body.classList.remove('hidden-overflow');
    document.getElementById("content").style.display = "block";


    const observerOptions = {
      root: null,
      rootMargin: "0px",
      threshold: 0.2,
    };
  
    const observerCallback = (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible-ani");
          observer.unobserve(entry.target);
        }
      });
    };
  
    const observer = new IntersectionObserver(observerCallback, observerOptions);
  
    const boxes = document.querySelectorAll(".box");
    boxes.forEach((box) => {
      observer.observe(box);
    });
  });


  