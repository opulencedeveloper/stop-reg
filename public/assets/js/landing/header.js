
document.addEventListener("DOMContentLoaded", function() {
    var navIcons = document.querySelector('.nav-icon2');
    var navIconNav = document.querySelector('.nav-icon2-mobile');
    const navMenu = document.querySelector(".nav-menu");
    const overLay = document.getElementById("overlay");

    navIcons.addEventListener('click', function() {
        this.classList.add('open');
        navMenu.classList.add("active");
        navIconNav.classList.add("open");
    });

    navIconNav.addEventListener('click', function() {
        this.classList.remove('open');
        navIcons.classList.remove("open");
        navMenu.classList.remove("active");
        if (overLay) overLay.style.display = "none";
    });


});
