
document.addEventListener("DOMContentLoaded", function() {
    var navIcons = document.querySelector('.nav-icon2');
    var navIconNav = document.querySelector('.nav-icon2-mobile');
    const navMenu = document.querySelector(".nav-menu");

    navIcons.addEventListener('click', function() {
        this.classList.add('open');
        navMenu.classList.add("active");
        navIconNav.classList.add("open");
    });

    navIconNav.addEventListener('click', function() {
        this.classList.remove('open');
        navIcons.classList.remove("open");
        navMenu.classList.remove("active");
    });

    
        // navIcons.addEventListener('click', function() {
        //     console.log("clocked")
        //     this.classList.toggle('open');
        //     navMenu.classList.toggle("active");
        // });

});


// const hamburger = document.querySelector(".hamburger");

// hamburger.addEventListener("click", () => {
//     console.log("clicked")
//     hamburger.classList.toggle("active");
//     // navMenu.classList.toggle("active");
//   });