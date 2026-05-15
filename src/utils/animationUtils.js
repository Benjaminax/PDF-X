import gsap from 'gsap';

export const entranceAnimation = (elements, stagger = 0.1) => {
  return gsap.fromTo(elements, 
    { 
      opacity: 0, 
      y: 20,
      scale: 0.95
    }, 
    { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      duration: 0.8, 
      stagger: stagger, 
      ease: "power4.out" 
    }
  );
};

export const titleReveal = (element) => {
  return gsap.fromTo(element,
    { clipPath: 'polygon(0 100%, 100% 100%, 100% 100%, 0 100%)', y: 20 },
    { clipPath: 'polygon(0 0%, 100% 0%, 100% 100%, 0 100%)', y: 0, duration: 1, ease: "power4.out" }
  );
};

export const magneticEffect = (element, strength = 0.5) => {
  const moveElement = (e) => {
    const { clientX, clientY } = e;
    const { left, top, width, height } = element.getBoundingClientRect();
    const x = (clientX - (left + width / 2)) * strength;
    const y = (clientY - (top + height / 2)) * strength;
    
    gsap.to(element, { x, y, duration: 0.4, ease: "power2.out" });
  };

  const resetElement = () => {
    gsap.to(element, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1, 0.3)" });
  };

  element.addEventListener('mousemove', moveElement);
  element.addEventListener('mouseleave', resetElement);

  return () => {
    element.removeEventListener('mousemove', moveElement);
    element.removeEventListener('mouseleave', resetElement);
  };
};
