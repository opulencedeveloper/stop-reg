window.onload = function () {
  const accordionButtons = document.querySelectorAll(".accordion-button");
  // Yearly pricing removed - commented out
  const monthlyBtn = document.querySelector(".land-pricing-sect-mth");
  // const yearlyBtn = document.querySelector(".land-pricing-sect-yr");
  // const selector = document.querySelector(".land-pricing-sect-selctor");
  const monthlyContent = document.querySelector(".land-cont-mnth");
  // const yearlyContent = document.querySelector(".land-cont-yr");
  const landPricingSectMthBtn = document.querySelector(
    ".land-pricing-sect-mth"
  );
  // const landPricingSectYrBtn = document.querySelector(".land-pricing-sect-yr");
  var navIcons = document.querySelector('.nav-icon2');
  const navMenu = document.querySelector(".nav-menu");

  if (accordionButtons) {
    accordionButtons.forEach((button) => {
      button.addEventListener("click", function () {
        const content = this.nextElementSibling;

        if (content.style.maxHeight) {
          content.style.maxHeight = null;

          this.classList.remove("active");
        } else {
          content.style.maxHeight = content.scrollHeight + "px";

          this.classList.add("active");
        }

        accordionButtons.forEach((otherButton) => {
          if (otherButton !== this) {
            const otherContent = otherButton.nextElementSibling;

            otherContent.style.maxHeight = null;

            otherButton.classList.remove("active");
          }
        });
      });
    });
  }

  // Yearly pricing toggle removed - commented out
  // if (monthlyBtn) {
  //   monthlyBtn.addEventListener("click", function () {
  //     selector.style.transform = "translateX(10%)";
  //     monthlyContent.classList.add("active");
  //     yearlyContent.classList.remove("active");
  //     landPricingSectMthBtn.classList.add("active-btn");
  //     landPricingSectYrBtn.classList.remove("active-btn");
  //   });
  // }

  // if (yearlyBtn) {
  //   yearlyBtn.addEventListener("click", function () {
  //     selector.style.transform = "translateX(100%)";
  //     yearlyContent.classList.add("active");
  //     monthlyContent.classList.remove("active");
  //     landPricingSectYrBtn.classList.add("active-btn");
  //     landPricingSectMthBtn.classList.remove("active-btn");
  //   });
  // }

  function startProgress(progressBarId, progressLabelId, limit) {
    let progress = 0;
    const progressBar = document.getElementById(progressBarId);
    const progressLabel = document.getElementById(progressLabelId);

    if (progressBar && progressBar) {
      const interval = setInterval(() => {
        if (progress >= limit) {
          clearInterval(interval);
        } else {
          progress += 1;
          progressLabel.innerHTML = progress + "%";
          progressBar.style.width = progress + "%";
        }
      }, 20);
    }
  }

  startProgress("prog-1", "prog-1-label", 100);
  startProgress("prog-2", "prog-2-label", 98);
  startProgress("prog-3", "prog-3-label", 92);

  const docsScrollButton = document.querySelectorAll(".docsScrollButton");
  let isProgrammaticScroll = false;
  let scrollTimeout;

  if (docsScrollButton) {
    // Scroll spy functionality - update active button based on scroll position
    const docSections = document.querySelectorAll('[id^="docume-item"]');
    
    // Function to update active button based on visible section
    const updateActiveButton = (sectionId) => {
      if (isProgrammaticScroll) return; // Don't update during programmatic scrolling

      const targetButton = document.querySelector(
        `[policy-data-target="${sectionId}"]`
      );

      if (targetButton) {
        // Remove active class from all buttons
        document.querySelectorAll(".docsScrollButton").forEach((btn) => {
          btn.classList.remove("active-docume-list-item");
        });
        // Add active class to the corresponding button
        targetButton.classList.add("active-docume-list-item");
      }
    };

    // Set up scroll spy if sections exist
    if (docSections.length > 0) {
      // Use Intersection Observer for better performance
      const observerOptions = {
        root: null,
        rootMargin: '-140px 0px -50% 0px', // Offset from top, trigger when section reaches ~140px from top
        threshold: [0, 0.25, 0.5, 0.75, 1]
      };

      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.1) {
            updateActiveButton(entry.target.id);
          }
        });
      }, observerOptions);

      // Observe all documentation sections
      docSections.forEach((section) => {
        observer.observe(section);
      });

      // Fallback: scroll event for sections that might not trigger observer
      let ticking = false;
      window.addEventListener("scroll", () => {
        if (isProgrammaticScroll || ticking) return;
        
        ticking = true;
        window.requestAnimationFrame(() => {
          const offset = 200;
          let currentSection = null;
          let minDistance = Infinity;

          docSections.forEach((section) => {
            const rect = section.getBoundingClientRect();
            const distance = Math.abs(rect.top - offset);

            // Prefer sections that are in viewport
            if (rect.top <= offset + 150 && rect.bottom >= 0) {
              if (distance < minDistance) {
                minDistance = distance;
                currentSection = section;
              }
            }
          });

          if (currentSection) {
            updateActiveButton(currentSection.id);
          }
          
          ticking = false;
        });
      });
    }

    // Button click handlers
    docsScrollButton.forEach((button) => {
      button.addEventListener("click", function () {
        // Remove active class from all buttons
        document.querySelectorAll(".docsScrollButton").forEach((btn) => {
          btn.classList.remove("active-docume-list-item");
        });
  
        // Add active class to the clicked button
        this.classList.add("active-docume-list-item");
  
        // Get the target element and offset
        const targetId = this.getAttribute("policy-data-target");
        const targetElement = document.getElementById(targetId);
        const offset = 140; // offset in px
  
        if (targetElement) {
          // Mark as programmatic scroll to prevent scroll spy from interfering
          isProgrammaticScroll = true;
          clearTimeout(scrollTimeout);

          // Calculate the position to scroll with offset
          const elementRect = targetElement.getBoundingClientRect();
          const elementTop = elementRect.top + window.pageYOffset;
          const offsetPosition = elementTop - offset;
  
          // Scroll to the adjusted position
          window.scrollTo({
            top: offsetPosition,
            behavior: "smooth",
          });

          // Re-enable scroll spy after scroll completes
          scrollTimeout = setTimeout(() => {
            isProgrammaticScroll = false;
          }, 800); // Wait 800ms after scroll ends
        } else {
          console.warn(`Element with ID ${targetId} not found`);
        }
      });
    });
  }
  

  // if (docsScrollButton) {
  //   docsScrollButton.forEach((button) => {
  //     button.addEventListener("click", function () {
  //       // Remove active class from all buttons
  //       document.querySelectorAll(".docsScrollButton").forEach((btn) => {
  //         btn.classList.remove("active-docume-list-item");
  //       });

  //       // Add active class to the clicked button
  //       this.classList.add("active-docume-list-item");

  //       // Scroll the target item into view
  //       const targetId = this.getAttribute("policy-data-target");
  //       const targetElement = document.getElementById(targetId);
  //       const offset = 40; // offset in px
  //       const bodyRect = document.body.getBoundingClientRect().top;
  //       const elementRect = targetElement.getBoundingClientRect().top;
  //       const elementPosition = elementRect - bodyRect;
  //       const offsetPosition = elementPosition - offset;

  //       if (targetElement) {
  //         targetElement.scrollIntoView({
  //           behavior: "smooth",
  //           block: "start",
  //         });
  //       } else {
  //         console.warn(`Element with ID ${targetId} not found`);
  //       }
  //     });
  //   });
  // }

  const sectionScroller = document.querySelectorAll(".section-scroller");


  if (sectionScroller) {
    sectionScroller.forEach((button) => {
      button.addEventListener("click", function () {
       
        const targetId = this.getAttribute("content-data-target");
        const targetElement = document.getElementById(targetId);
        navIcons.classList.remove("open");
        navMenu.classList.remove("active")
        if (overLay) overLay.style.display = "none";

        if (targetElement) {
          targetElement.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        } else {
          console.warn(`Element with ID ${targetId} not found`);
        }
      });
    });
  }

  const nav = document.querySelector(".docume-content-nav");

  if (nav) {
    window.addEventListener("scroll", function () {
      // Get the distance from the top of the viewport to the top of the nav element
      const navTop = nav.getBoundingClientRect().top;
      
      // Add or remove the class based on the scroll position
      if (navTop <= 100) {
        nav.classList.add("row");
      } else {
        nav.classList.remove("row");
      }
    });
  }
  

  const overLay = document.getElementById("overlay");
  const signUpOverLayBtns = document.querySelectorAll(".signup-overlay-btn");
  const signInOverLayBtns = document.querySelectorAll(".signin-overlay-btn");
  const signupDialog = document.getElementById("signup-dialog");
  const signinDialog = document.getElementById("signin-dialog");

  if (signUpOverLayBtns) {
    signUpOverLayBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        overLay.style.display = "flex";
        navIcons.classList.remove("open");
        navMenu.classList.remove("active")
        signupDialog.style.display = "block";
        signupDialog.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
      });
        signinDialog.style.display = "none";
        document.body.classList.add("hidden-overflow");
      });
    });
  }

  if (signInOverLayBtns) {
    signInOverLayBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        overLay.style.display = "flex";
        signinDialog.style.display = "block";
        signinDialog.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
      });
        navIcons.classList.remove("open");
        navMenu.classList.remove("active")
        signupDialog.style.display = "none";
        document.body.classList.add("hidden-overflow");
      });
    });
  }

  const signUpClose = document.getElementById("signup-close-btn");
  if (signUpClose) {
    signUpClose.addEventListener("click", () => {
      signupDialog.classList.add("fadeOut");

      signupDialog.addEventListener(
        "animationend",
        function () {
          signupDialog.classList.remove("fadeOut");
          overLay.style.display = "none";
          document.body.classList.remove("hidden-overflow");
        },
        { once: true }
      );
    });
  }

  const signinCloseBtn = document.getElementById("signin-close-btn");
  if (signinCloseBtn) {
    signinCloseBtn.addEventListener("click", () => {
      signinDialog.classList.add("fadeOut");

      signinDialog.addEventListener(
        "animationend",
        function () {
          signinDialog.classList.remove("fadeOut");
          overLay.style.display = "none";
          document.body.classList.remove("hidden-overflow");
        },
        { once: true }
      );
    });
  }

  const toggleSignInPassword = document.getElementById("signin-password-btn");
  const signInPassword = document.getElementById("signin-password");

  if (toggleSignInPassword) {
    toggleSignInPassword.addEventListener("click", function (e) {
      const passwordType =
      signInPassword.getAttribute("type") === "password" ? "text" : "password";
  
      signInPassword.setAttribute("type", passwordType);
  
      const passwordIconSrc =
        passwordType === "password"
          ? "/assets/icons/obsured.svg"
          : "/assets/icons/obsure.svg";
  
      toggleSignInPassword.setAttribute("src", passwordIconSrc);
    });
  }


  const toggleSignUpPassword = document.getElementById("signup-password-btn");
  const signUpPassword = document.getElementById("signup-password");

  if (toggleSignUpPassword) {
    toggleSignUpPassword.addEventListener("click", function (e) {
      const passwordType =
       signUpPassword.getAttribute("type") === "password" ? "text" : "password";
  
     signUpPassword.setAttribute("type", passwordType);
  
      const passwordIconSrc =
        passwordType === "password"
          ? "/assets/icons/obsured.svg"
          : "/assets/icons/obsure.svg";
  
      toggleSignUpPassword.setAttribute("src", passwordIconSrc);
    });
  }

  const toggleSignUpCPassword = document.getElementById("signup-cpassword-btn");
  const cPassword = document.getElementById("signup-cpassword");

  if (toggleSignUpCPassword) {
    toggleSignUpCPassword.addEventListener("click", function (e) {
      const passwordType =
      cPassword.getAttribute("type") === "password" ? "text" : "password";
  
      cPassword.setAttribute("type", passwordType);
  
      const passwordIconSrc =
        passwordType === "password"
          ? "/assets/icons/obsured.svg"
          : "/assets/icons/obsure.svg";
  
      toggleSignUpCPassword.setAttribute("src", passwordIconSrc);
    });
  }
  const toggleSignUpRPassword = document.getElementById("signup-rpassword-btn");
  const rPassword = document.getElementById("signup-rpassword");

  if (toggleSignUpRPassword) {
    toggleSignUpRPassword.addEventListener("click", function (e) {
      const passwordType =
      rPassword.getAttribute("type") === "password" ? "text" : "password";
  
      rPassword.setAttribute("type", passwordType);
  
      const passwordIconSrc =
        passwordType === "password"
          ? "/assets/icons/obsured.svg"
          : "/assets/icons/obsure.svg";
  
      toggleSignUpRPassword.setAttribute("src", passwordIconSrc);
    });
  }

  // Code Snippet Functionality
  const codeTabs = document.querySelectorAll(".code-tab");
  const codeContent = document.getElementById("code-content");
  const copyBtn = document.querySelector(".code-copy-btn");

  // Syntax highlighting function - builds DOM nodes manually
  function highlightCodeToNodes(code, language) {
    if (!code) return document.createDocumentFragment();
    
    const container = document.createDocumentFragment();
    const lines = code.split('\n');
    
    // Define keyword patterns for each language
    let keywordPattern, stringPattern, functionPattern, numberPattern, variablePattern;
    
    if (language === 'nodejs' || language === 'javascript') {
      keywordPattern = /\b(import|from|const|let|var|await|async|function|return|if|else|for|while|do|switch|case|break|continue|try|catch|finally|throw|new|class|extends|super|this|static|default|export|as|in|of|typeof|instanceof|void|null|undefined|true|false)\b/g;
      stringPattern = /(['"`])(?:(?=(\\?))\2.)*?\1/g;
      functionPattern = /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*(?=\()/g;
      numberPattern = /\b(\d+)\b/g;
    } else if (language === 'python') {
      keywordPattern = /\b(import|from|as|def|class|if|elif|else|for|while|try|except|finally|with|return|yield|lambda|and|or|not|in|is|None|True|False|pass|break|continue)\b/g;
      stringPattern = /(['"])(?:(?=(\\?))\2.)*?\1/g;
      functionPattern = /\b([a-zA-Z_][a-zA-Z0-9_]*)\s*(?=\()/g;
      numberPattern = /\b(\d+)\b/g;
    } else if (language === 'php') {
      keywordPattern = /\b(function|class|public|private|protected|static|const|if|else|elseif|for|foreach|while|do|switch|case|break|continue|return|try|catch|finally|throw|new|use|namespace|as|echo|print|var|array|string|int|bool|true|false|null)\b/gi;
      stringPattern = /(['"])(?:(?=(\\?))\2.)*?\1/g;
      variablePattern = /\$([a-zA-Z_][a-zA-Z0-9_]*)/g;
      numberPattern = /\b(\d+)\b/g;
    } else if (language === 'go') {
      keywordPattern = /\b(package|import|func|var|const|type|struct|interface|if|else|for|range|switch|case|default|break|continue|return|go|defer|chan|select|map|slice|make|new|nil|true|false|int|string|bool|float64|error)\b/g;
      stringPattern = /(["'`])(?:(?=(\\?))\2.)*?\1/g;
      functionPattern = /\b([a-zA-Z_][a-zA-Z0-9_]*)\s*(?=\()/g;
      numberPattern = /\b(\d+)\b/g;
    } else if (language === 'java') {
      keywordPattern = /\b(public|private|protected|static|final|class|interface|extends|implements|import|package|if|else|for|while|do|switch|case|break|continue|return|try|catch|finally|throw|new|this|super|void|int|String|boolean|double|float|char|byte|short|long|null|true|false)\b/g;
      stringPattern = /(["'])(?:(?=(\\?))\2.)*?\1/g;
      functionPattern = /\b([A-Z][a-zA-Z0-9_]*)\s*(?=\()/g;
      numberPattern = /\b(\d+)\b/g;
    } else if (language === 'csharp') {
      keywordPattern = /\b(using|namespace|class|interface|public|private|protected|static|readonly|const|void|int|string|bool|double|float|char|byte|if|else|for|foreach|while|do|switch|case|break|continue|return|try|catch|finally|throw|new|this|base|async|await|Task|var|null|true|false)\b/g;
      stringPattern = /(["'])(?:(?=(\\?))\2.)*?\1/g;
      functionPattern = /\b([A-Z][a-zA-Z0-9_]*)\s*(?=\()/g;
      numberPattern = /\b(\d+)\b/g;
    } else if (language === 'curl') {
      stringPattern = /(["'])(?:(?=(\\?))\2.)*?\1/g;
      keywordPattern = /\b(curl|-X|-H)\b/g;
    }
    
    lines.forEach((line, lineIndex) => {
      if (lineIndex > 0) {
        container.appendChild(document.createTextNode('\n'));
      }
      
      if (!line.trim()) {
        container.appendChild(document.createTextNode(line));
        return;
      }
      
      // Process line by creating spans manually
      let remaining = line;
      let lastIndex = 0;
      const segments = [];
      
      // Collect all matches with their positions
      const matches = [];
      
      // Handle PHP opening tags first
      if (language === 'php') {
        const phpTagMatch = remaining.match(/^(\<\?php|\<\?)/);
        if (phpTagMatch) {
          matches.push({
            type: 'keyword',
            text: phpTagMatch[0],
            index: 0,
            length: phpTagMatch[0].length
          });
          remaining = remaining.substring(phpTagMatch[0].length);
          lastIndex = phpTagMatch[0].length;
        }
      }
      
      // Find all keyword matches
      if (keywordPattern) {
        let match;
        keywordPattern.lastIndex = 0;
        while ((match = keywordPattern.exec(remaining)) !== null) {
          matches.push({
            type: 'keyword',
            text: match[0],
            index: match.index + lastIndex,
            length: match[0].length
          });
        }
      }
      
      // Find all string matches
      if (stringPattern) {
        let match;
        stringPattern.lastIndex = 0;
        while ((match = stringPattern.exec(remaining)) !== null) {
          matches.push({
            type: 'string',
            text: match[0],
            index: match.index + lastIndex,
            length: match[0].length
          });
        }
      }
      
      // Find all function matches
      if (functionPattern) {
        let match;
        functionPattern.lastIndex = 0;
        while ((match = functionPattern.exec(remaining)) !== null) {
          matches.push({
            type: 'function',
            text: match[1] || match[0],
            index: match.index + lastIndex,
            length: (match[1] || match[0]).length
          });
        }
      }
      
      // Find all number matches
      if (numberPattern) {
        let match;
        numberPattern.lastIndex = 0;
        while ((match = numberPattern.exec(remaining)) !== null) {
          matches.push({
            type: 'number',
            text: match[1] || match[0],
            index: match.index + lastIndex,
            length: (match[1] || match[0]).length
          });
        }
      }
      
      // Find variable matches (for PHP)
      if (variablePattern && language === 'php') {
        let match;
        variablePattern.lastIndex = 0;
        while ((match = variablePattern.exec(remaining)) !== null) {
          matches.push({
            type: 'variable',
            text: match[0],
            index: match.index + lastIndex,
            length: match[0].length
          });
        }
      }
      
      // Sort matches by index
      matches.sort((a, b) => a.index - b.index);
      
      // Remove overlapping matches (keep first)
      const nonOverlapping = [];
      let currentEnd = 0;
      matches.forEach(match => {
        if (match.index >= currentEnd) {
          nonOverlapping.push(match);
          currentEnd = match.index + match.length;
        }
      });
      
      // Build the line with spans
      let currentPos = 0;
      nonOverlapping.forEach(match => {
        // Add text before match
        if (match.index > currentPos) {
          const textBefore = line.substring(currentPos, match.index);
          if (textBefore) {
            container.appendChild(document.createTextNode(textBefore));
          }
        }
        
        // Add highlighted span
        const span = document.createElement('span');
        span.className = match.type;
        span.textContent = match.text;
        container.appendChild(span);
        
        currentPos = match.index + match.length;
      });
      
      // Add remaining text
      if (currentPos < line.length) {
        const remainingText = line.substring(currentPos);
        if (remainingText) {
          container.appendChild(document.createTextNode(remainingText));
        }
      }
    });
    
    return container;
  }
  
  // Legacy function for backward compatibility - returns HTML string
  function highlightCode(code, language) {
    if (!code) return '';
    
    // Escape HTML in the original code first (but preserve our spans)
    // We need to escape & first, then < and >
    let highlighted = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    
    // Now add our HTML spans - these should NOT be escaped
    
    if (language === 'nodejs' || language === 'javascript') {
      // Process in order: strings first (to avoid highlighting inside strings), then keywords, then functions, then variables, then numbers
      
      // Strings (single, double, template literals) - do this first
      const stringRegex = /(['"`])(?:(?=(\\?))\2.)*?\1/g;
      const stringMatches = [];
      highlighted = highlighted.replace(stringRegex, (match) => {
        const id = `__STRING_${stringMatches.length}__`;
        stringMatches.push(match);
        return id;
      });
      
      // Keywords
      const keywords = /\b(import|from|const|let|var|await|async|function|return|if|else|for|while|do|switch|case|break|continue|try|catch|finally|throw|new|class|extends|super|this|static|default|export|as|in|of|typeof|instanceof|void|null|undefined|true|false)\b/g;
      highlighted = highlighted.replace(keywords, '<span class="keyword">$&</span>');
      
      // Functions - process after keywords to avoid conflicts
      // Only match functions that aren't already inside a span
      highlighted = highlighted.replace(/\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*(?=\()/g, (match, funcName, offset, string) => {
        // Check if already inside a span by looking backwards
        const before = string.substring(Math.max(0, offset - 100), offset);
        const lastSpanOpen = before.lastIndexOf('<span');
        const lastSpanClose = before.lastIndexOf('</span>');
        // If there's an open span without a close, we're inside a span
        if (lastSpanOpen > lastSpanClose) {
          return match; // Don't wrap, already in a span
        }
        return '<span class="function">' + funcName + '</span>';
      });
      
      // Variables (const/let/var declarations) - but not if already highlighted
      highlighted = highlighted.replace(/\b(const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g, (match, decl, varName) => {
        if (match.includes('<span')) return match;
        return decl + ' <span class="variable">' + varName + '</span>';
      });
      
      // Numbers
      highlighted = highlighted.replace(/\b(\d+)\b/g, '<span class="number">$1</span>');
      
      // Restore strings
      stringMatches.forEach((str, index) => {
        highlighted = highlighted.replace(`__STRING_${index}__`, '<span class="string">' + str + '</span>');
      });
    } else if (language === 'python') {
      const keywords = /\b(import|from|as|def|class|if|elif|else|for|while|try|except|finally|with|return|yield|lambda|and|or|not|in|is|None|True|False|pass|break|continue)\b/g;
      highlighted = highlighted.replace(keywords, '<span class="keyword">$&</span>');
      highlighted = highlighted.replace(/(['"])(?:(?=(\\?))\2.)*?\1/g, '<span class="string">$&</span>');
      highlighted = highlighted.replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)\s*(?=\()/g, '<span class="function">$1</span>');
      highlighted = highlighted.replace(/\b(\d+)\b/g, '<span class="number">$1</span>');
    } else if (language === 'php') {
      // Handle PHP opening tag first before escaping
      highlighted = highlighted.replace(/&lt;\?php/g, '<span class="keyword">&lt;?php</span>');
      highlighted = highlighted.replace(/&lt;\?/g, '<span class="keyword">&lt;?</span>');
      
      // Then handle other keywords (but not the already wrapped ones)
      const keywords = /\b(function|class|public|private|protected|static|const|if|else|elseif|for|foreach|while|do|switch|case|break|continue|return|try|catch|finally|throw|new|use|namespace|as|echo|print|var|array|string|int|bool|true|false|null)\b/gi;
      highlighted = highlighted.replace(keywords, (match, offset, string) => {
        // Check if already inside a span
        const before = string.substring(Math.max(0, offset - 50), offset);
        if (before.includes('<span')) {
          const lastSpan = before.lastIndexOf('<span');
          const lastClose = before.lastIndexOf('</span>');
          if (lastSpan > lastClose) return match; // Inside a span
        }
        return '<span class="keyword">' + match + '</span>';
      });
      
      highlighted = highlighted.replace(/(['"])(?:(?=(\\?))\2.)*?\1/g, '<span class="string">$&</span>');
      highlighted = highlighted.replace(/\$([a-zA-Z_][a-zA-Z0-9_]*)/g, '<span class="variable">$$1</span>');
      highlighted = highlighted.replace(/\b(\d+)\b/g, '<span class="number">$1</span>');
    } else if (language === 'go') {
      const keywords = /\b(package|import|func|var|const|type|struct|interface|if|else|for|range|switch|case|default|break|continue|return|go|defer|chan|select|map|slice|make|new|nil|true|false|int|string|bool|float64|error)\b/g;
      highlighted = highlighted.replace(keywords, '<span class="keyword">$&</span>');
      highlighted = highlighted.replace(/(["'`])(?:(?=(\\?))\2.)*?\1/g, '<span class="string">$&</span>');
      highlighted = highlighted.replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)\s*(?=\()/g, '<span class="function">$1</span>');
      highlighted = highlighted.replace(/\b(\d+)\b/g, '<span class="number">$1</span>');
    } else if (language === 'java') {
      const keywords = /\b(public|private|protected|static|final|class|interface|extends|implements|import|package|if|else|for|while|do|switch|case|break|continue|return|try|catch|finally|throw|new|this|super|void|int|String|boolean|double|float|char|byte|short|long|null|true|false)\b/g;
      highlighted = highlighted.replace(keywords, '<span class="keyword">$&</span>');
      highlighted = highlighted.replace(/(["'])(?:(?=(\\?))\2.)*?\1/g, '<span class="string">$&</span>');
      highlighted = highlighted.replace(/\b([A-Z][a-zA-Z0-9_]*)\s*(?=\()/g, '<span class="function">$1</span>');
      highlighted = highlighted.replace(/\b(\d+)\b/g, '<span class="number">$1</span>');
    } else if (language === 'csharp') {
      const keywords = /\b(using|namespace|class|interface|public|private|protected|static|readonly|const|void|int|string|bool|double|float|char|byte|if|else|for|foreach|while|do|switch|case|break|continue|return|try|catch|finally|throw|new|this|base|async|await|Task|var|null|true|false)\b/g;
      highlighted = highlighted.replace(keywords, '<span class="keyword">$&</span>');
      highlighted = highlighted.replace(/(["'])(?:(?=(\\?))\2.)*?\1/g, '<span class="string">$&</span>');
      highlighted = highlighted.replace(/\b([A-Z][a-zA-Z0-9_]*)\s*(?=\()/g, '<span class="function">$1</span>');
      highlighted = highlighted.replace(/\b(\d+)\b/g, '<span class="number">$1</span>');
    } else if (language === 'curl') {
      // For curl, just highlight strings
      highlighted = highlighted.replace(/(["'])(?:(?=(\\?))\2.)*?\1/g, '<span class="string">$&</span>');
      highlighted = highlighted.replace(/\b(curl|-X|-H)\b/g, '<span class="keyword">$1</span>');
    }
    
    // Ensure we return valid HTML (no unescaped HTML tags from original code)
    // The spans we added should be fine since we added them after escaping
    return highlighted;
  }

  const codeExamples = {
    nodejs: `import fetch from 'node-fetch';

const apiToken = 'YOUR_API_TOKEN';
const email = 'test@example.com';

const response = await fetch(
  \` https://api.stopreg.com/api/v1/check/\${apiToken}?email=\${email}\`,
  {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  }
);

const data = await response.json();
console.log(data);`,
    curl: `curl -X GET \\
  "https://api.stopreg.com/api/v1/check/YOUR_API_TOKEN?email=test@example.com" \\
  -H "Content-Type: application/json"`,
    python: `import requests

api_token = 'YOUR_API_TOKEN'
email = 'test@example.com'

url = f' https://api.stopreg.com/api/v1/check/{api_token}?email={email}'

response = requests.get(url, headers={
    'Content-Type': 'application/json'
})

data = response.json()
print(data)`,
    php: `<?php

$apiToken = 'YOUR_API_TOKEN';
$email = 'test@example.com';

$url = "https://api.stopreg.com/api/v1/check/{$apiToken}?email=" . urlencode($email);

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json'
]);

$response = curl_exec($ch);
$data = json_decode($response, true);

curl_close($ch);
print_r($data);`,
    go: `package main

import (
    "encoding/json"
    "fmt"
    "io"
    "net/http"
    "net/url"
)

func main() {
    apiToken := "YOUR_API_TOKEN"
    email := "test@example.com"
    
    baseURL := "https://api.stopreg.com/api/v1/check/"
    params := url.Values{}
    params.Add("email", email)
    
    reqURL := baseURL + apiToken + "?" + params.Encode()
    
    req, _ := http.NewRequest("GET", reqURL, nil)
    req.Header.Set("Content-Type", "application/json")
    
    client := &http.Client{}
    resp, _ := client.Do(req)
    defer resp.Body.Close()
    
    body, _ := io.ReadAll(resp.Body)
    var data map[string]interface{}
    json.Unmarshal(body, &data)
    fmt.Println(data)
}`,
    java: `import java.net.HttpURLConnection;
import java.net.URL;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.URLEncoder;

public class ApiCheck {
    public static void main(String[] args) throws Exception {
        String apiToken = "YOUR_API_TOKEN";
        String email = "test@example.com";
        
        String urlString = "https://api.stopreg.com/api/v1/check/" 
            + apiToken + "?email=" + URLEncoder.encode(email, "UTF-8");
        
        URL url = new URL(urlString);
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("GET");
        conn.setRequestProperty("Content-Type", "application/json");
        
        BufferedReader in = new BufferedReader(
            new InputStreamReader(conn.getInputStream())
        );
        String inputLine;
        StringBuilder response = new StringBuilder();
        while ((inputLine = in.readLine()) != null) {
            response.append(inputLine);
        }
        in.close();
        
        System.out.println(response.toString());
    }
}`,
    csharp: `using System;
using System.Net.Http;
using System.Threading.Tasks;

class Program
{
    static async Task Main()
    {
        string apiToken = "YOUR_API_TOKEN";
        string email = "test@example.com";
        
        string url = $"https://api.stopreg.com/api/v1/check/{apiToken}?email={Uri.EscapeDataString(email)}";
        
        using (HttpClient client = new HttpClient())
        {
            client.DefaultRequestHeaders.Add("Content-Type", "application/json");
            
            HttpResponseMessage response = await client.GetAsync(url);
            string data = await response.Content.ReadAsStringAsync();
            
            Console.WriteLine(data);
        }
    }
}`
  };

  // Initialize with Node.js code
  if (codeContent) {
    try {
      const codeNodes = highlightCodeToNodes(codeExamples.nodejs, 'nodejs');
      // Clear existing content
      codeContent.textContent = '';
      // Append the document fragment
      codeContent.appendChild(codeNodes);
    } catch (error) {
      console.error('Error initializing code:', error, error.stack);
      codeContent.textContent = codeExamples.nodejs;
    }
  }

  // Handle tab switching
  if (codeTabs.length > 0) {
    codeTabs.forEach((tab) => {
      tab.addEventListener("click", function () {
        // Remove active class from all tabs
        codeTabs.forEach((t) => t.classList.remove("active"));
        
        // Add active class to clicked tab
        this.classList.add("active");
        
        // Get the language
        const lang = this.getAttribute("data-lang");
        
        // Update code content with syntax highlighting
        if (codeContent && codeExamples[lang]) {
          try {
            const codeNodes = highlightCodeToNodes(codeExamples[lang], lang);
            // Clear existing content
            codeContent.textContent = '';
            // Append the document fragment
            codeContent.appendChild(codeNodes);
          } catch (error) {
            console.error('Error highlighting code:', error, error.stack);
            codeContent.textContent = codeExamples[lang];
          }
        }
      });
    });
  }

  // Handle copy button
  if (copyBtn && codeContent) {
    copyBtn.addEventListener("click", function () {
      // Get plain text for copying (remove HTML tags)
      const textToCopy = codeContent.textContent || codeContent.innerText;
      
      navigator.clipboard.writeText(textToCopy).then(() => {
        // Visual feedback - change icon to checkmark temporarily
        const originalImg = copyBtn.querySelector('img');
        const originalSpan = copyBtn.querySelector('span');
        if (originalImg && originalSpan) {
          const originalSrc = originalImg.src;
          const originalText = originalSpan.textContent;
          copyBtn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16.6667 5L7.5 14.1667L3.33334 10" stroke="#6a9955" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>Copied</span>
          `;
          
          setTimeout(() => {
            copyBtn.innerHTML = `<img src="${originalSrc}" alt="Copy" /><span>${originalText}</span>`;
          }, 2000);
        }
      }).catch((err) => {
        console.error("Failed to copy:", err);
      });
    });
  }

  // How It Works Animation Logic
  const hiwSection = document.getElementById("how-it-works");
  if (hiwSection) {
    const header = hiwSection.querySelector(".how-it-works-header");
    const steps = hiwSection.querySelectorAll(".hiw-step");
    const arrows = hiwSection.querySelectorAll(".hiw-arrow");

    // Unified list of elements to animate sequentially
    // Sequence: Header -> Step 1 -> Arrow 1 -> Step 2 -> Arrow 2 -> Step 3 -> Arrow 3 -> Step 4 -> Arrow 4 -> Step 5
    const elementsToAnimate = [header];
    
    // Interleave steps and arrows for correct sequence
    steps.forEach((step, index) => {
      elementsToAnimate.push(step);
      if (arrows[index]) {
        elementsToAnimate.push(arrows[index]);
      }
    });

    const observerOption = {
      root: null,
      rootMargin: "0px",
      threshold: 0.15, // Trigger when 15% of the element is visible
    };

    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // Trigger sequence
          elementsToAnimate.forEach((el, index) => {
             if (el) {
                setTimeout(() => {
                    el.classList.add("hiw-animate-in");
                }, index * 200); // 200ms delay between each item
             }
          });
          sectionObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 }); // 50% of section visible starts the flow

    sectionObserver.observe(hiwSection);
  }

  // Hero Section Animation Logic
  const heroWrapper = document.querySelector(".hero-wrapper");
  if (heroWrapper) {
    const heroHeader = heroWrapper.querySelector(".hero-header");
    const heroTitle = heroWrapper.querySelector(".hero-title");
    const heroBtns = heroWrapper.querySelector(".hero-btn-wrapper");
    const heroImage = heroWrapper.querySelector(".hero-sect-image");

    const heroElements = [heroHeader, heroTitle, heroBtns, heroImage];

    const heroObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          heroElements.forEach((el) => {
            if (el) el.classList.add("hero-animate-in");
          });
          heroObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 }); // Trigger when 50% is visible

    heroObserver.observe(heroWrapper);
  }

  // What Stopreg Checks Animation Logic
  const wscSection = document.getElementById("what-stopreg-check");
  if (wscSection) {
    const wscHeader = wscSection.querySelector(".wsc-header");
    const wscCards = wscSection.querySelectorAll(".wsc-card");

    const wscObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
            // Animate header immediately
            if(wscHeader) wscHeader.classList.add("wsc-animate-in");

            // Stagger animations for cards
            wscCards.forEach((card, index) => {
                setTimeout(() => {
                    card.classList.add("wsc-animate-in");
                }, index * 100); // 100ms stagger delay
            });

            wscObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    wscObserver.observe(wscSection);
  }

  // Why Stopreg Animation Logic
  const whySection = document.getElementById("why-stopreg");
  if (whySection) {
    const whyHeader = whySection.querySelector(".why-header");
    const whyBgImage = whySection.querySelector(".why-bg-image img"); // Target inner img
    const whyItems = whySection.querySelectorAll(".why-item");

    const whyObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
            // Animate Header
            if (whyHeader) whyHeader.classList.add("why-animate-in");

            // Animate Background Image
            if (whyBgImage) {
                setTimeout(() => {
                    whyBgImage.classList.add("why-animate-in");
                }, 200); // Slight delay for bg image
            }

            // Stagger List Items
            whyItems.forEach((item, index) => {
                setTimeout(() => {
                    item.classList.add("why-animate-in");
                }, 300 + (index * 100)); // Start after header/image, then stagger
            });

            whyObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    whyObserver.observe(whySection);
  }

  // GDPR Section Animation Logic
  const gdprSection = document.getElementById("gdpr-data-protection");
  if (gdprSection) {
    const gdprTitle = gdprSection.querySelector(".gdpr-title");
    const gdprSubtitle = gdprSection.querySelector(".gdpr-subtitle");
    const gdprImage = gdprSection.querySelector(".gdpr-image img");

    const gdprObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
            // Animate Title
            if (gdprTitle) gdprTitle.classList.add("gdpr-animate-in");

            // Animate Subtitle
            if (gdprSubtitle) {
                setTimeout(() => {
                    gdprSubtitle.classList.add("gdpr-animate-in");
                }, 150); // 150ms delay
            }

            // Animate Image
            if (gdprImage) {
                setTimeout(() => {
                    gdprImage.classList.add("gdpr-animate-in");
                }, 300); // 300ms delay
            }

            gdprObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 }); // 50% threshold as requested

    gdprObserver.observe(gdprSection);
  }

  // API Section Animation Logic
  const apiSection = document.getElementById("api");
  if (apiSection) {
    const apiHeader = apiSection.querySelector(".fasi-sect-one-hd");
    const apiItems = apiSection.querySelectorAll(".fasi-api-item");
    const apiCode = apiSection.querySelector(".fasi-sect-two");

    const apiObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
            // Animate Header
            if (apiHeader) apiHeader.classList.add("fasi-animate-in");

            // Animate Code Snippet (sync with header)
            if (apiCode) apiCode.classList.add("fasi-animate-in");

            // Stagger API list items
            apiItems.forEach((item, index) => {
                setTimeout(() => {
                    item.classList.add("fasi-animate-in");
                }, 150 + (index * 150)); // Start after header, then stagger
            });

            apiObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 }); // 50% threshold

    apiObserver.observe(apiSection);
  }

  // Pricing Section Animation Logic
  const pricingSection = document.getElementById("pricing");
  if (pricingSection) {
    const pricingHeader = pricingSection.querySelector(".pricing-header");
    const pricingCards = pricingSection.querySelectorAll(".pricing-card");

    // Observer for the Header (Triggers when header is 50% visible)
    if (pricingHeader) {
        const headerObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    pricingHeader.classList.add("pricing-animate-in");
                    headerObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });
        headerObserver.observe(pricingHeader);
    }

    // Individual Observer for each Card (Triggers when THAT card is 50% visible)
    if (pricingCards.length > 0) {
        const cardObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("pricing-animate-in");
                    cardObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        pricingCards.forEach((card) => {
            cardObserver.observe(card);
        });
    }
  }

  // Tools (Integrations) Animation Logic
  const toolsSection = document.getElementById("wordpress-plugin");
  if (toolsSection) {
    const toolsHeader = toolsSection.querySelector(".wd-pr-lb-cont h2");
    const toolsItems = toolsSection.querySelectorAll(".wd-pr-lb-cont-inner-item");

    const toolsObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
            // Animate Header
            if (toolsHeader) toolsHeader.classList.add("tools-animate-in");

            // Stagger Tools Items
            toolsItems.forEach((item, index) => {
                setTimeout(() => {
                    item.classList.add("tools-animate-in");
                }, 100 + (index * 100)); // Rapid 100ms stagger for grid ripple
            });

            toolsObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 }); // 50% threshold

    toolsObserver.observe(toolsSection);
  }

  // Get Started (EFEA) Animation Logic
  const efeaSection = document.querySelector(".efea-wrapper");
  if (efeaSection) {
    const efeaTitle = efeaSection.querySelector(".efea-header-title");
    const efeaDesc = efeaSection.querySelector(".efea-header-desc");
    const efeaBtn = efeaSection.querySelector(".signup-overlay-btn");
    const efeaImage = efeaSection.querySelector(".efea-wrapper-sct-two-inner-two img");

    const efeaObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
            // Sequence: Title -> Button -> Description
            if (efeaTitle) efeaTitle.classList.add("efea-animate-in");
            
            // Image slides in with title but slower
            if (efeaImage) efeaImage.classList.add("efea-animate-in");

            if (efeaBtn) {
                setTimeout(() => {
                    efeaBtn.classList.add("efea-animate-in");
                }, 150);
            }

            if (efeaDesc) {
                setTimeout(() => {
                    efeaDesc.classList.add("efea-animate-in");
                }, 300);
            }

            efeaObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 }); // 50% threshold

    efeaObserver.observe(efeaSection);
  }

  // FAQ Animation Logic
  const faqSection = document.querySelector(".fags-wrapper");
  if (faqSection) {
    const faqHeader = faqSection.querySelector(".fags-hd");
    const faqSubtitle = faqSection.querySelector(".fags-tle");
    const faqItems = faqSection.querySelectorAll(".accordion-item");

    // 1. Section Observer for Header & Subtitle
    const faqSectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
            if (faqHeader) faqHeader.classList.add("fags-animate-in");
            if (faqSubtitle) {
                setTimeout(() => {
                    faqSubtitle.classList.add("fags-animate-in");
                }, 150);
            }
            faqSectionObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 }); // 50% for text

    faqSectionObserver.observe(faqSection);

    // 2. Individual Item Observer (20% In View)
    const faqItemObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("faq-item-animate-in");
                faqItemObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.2 }); // Reduced threshold for reliable mobile triggering

    faqItems.forEach(item => {
        faqItemObserver.observe(item);
    });
  }

  // Footer Animation Logic
  const footerSection = document.querySelector(".land-foot");
  if (footerSection) {
    const footerBrand = footerSection.querySelector(".foot-col-brand");
    const footerCols = footerSection.querySelectorAll(".foot-links-group .foot-col");
    const footerBottom = footerSection.querySelector(".land-foot-wrapp-sct-two");

    const footerObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
            // 1. Brand Column
            if (footerBrand) footerBrand.classList.add("footer-animate-in");

            // 2. Link Columns (Staggered)
            footerCols.forEach((col, index) => {
                setTimeout(() => {
                    col.classList.add("footer-animate-in");
                }, 150 + (index * 150));
            });

            // 3. Bottom Bar
            if (footerBottom) {
                setTimeout(() => {
                    footerBottom.classList.add("footer-animate-in");
                }, 600);
            }

            footerObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 }); // 50% threshold

    footerObserver.observe(footerSection);
  }
};

// document.getElementById("navigate-button").addEventListener("click", function() {
//   window.location.href = "page2.html#section2";
// });

// if(closeOverLayBtnLogout) {
//   closeOverLayBtnLogout.addEventListener("click", () => {
//     overlayDialogLogout.classList.add("fadeOut");

//     overlayDialogLogout.addEventListener(
//       "animationend",
//       function () {
//         overlayDialogLogout.classList.remove("fadeOut");
//         overlayLogout.style.display = "none";
//       },
//       { once: true }
//     );
//   });
// }

  /* Sticky Sidebar JS Implementation */
  const stickySidebar = document.querySelector(".sticky-docs-sidebar");
  const stickyLayout = document.querySelector(".sticky-docs-layout");

  if (stickySidebar && stickyLayout) {
    const handleScroll = () => {
      // Disable on mobile
      if (window.innerWidth <= 852) {
        stickySidebar.classList.remove("js-sticky-fixed", "js-sticky-absolute-bottom");
        stickySidebar.style.width = ""; // Reset width
        return;
      }

      const layoutRect = stickyLayout.getBoundingClientRect();
      const headerOffset = 130; // The top gap we want

      // Case 1: We are above the start of the content (or just started scrolling into it)
      if (layoutRect.top > headerOffset) {
        stickySidebar.classList.remove("js-sticky-fixed", "js-sticky-absolute-bottom");
        stickySidebar.style.width = "";
        return;
      }

      // Sidebar calculation
      const sidebarHeight = stickySidebar.offsetHeight;
      const layoutBottomLimit = headerOffset + sidebarHeight;

      // Case 3: We hit the bottom
      // If the bottom of the layout is higher than the bottom of where the sidebar would be
      if (layoutRect.bottom < layoutBottomLimit) {
        stickySidebar.classList.remove("js-sticky-fixed");
        stickySidebar.classList.add("js-sticky-absolute-bottom");
        stickySidebar.style.width = "320px"; // Enforce width in absolute mode
      } else {
        // Case 2: Fixed mode
        stickySidebar.classList.remove("js-sticky-absolute-bottom");
        stickySidebar.classList.add("js-sticky-fixed");
         stickySidebar.style.width = "320px"; // Enforce width in fixed mode
      }
    };

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleScroll);
    // Initial check
    handleScroll();
  }


