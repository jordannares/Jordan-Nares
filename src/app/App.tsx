import { useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { motion } from "motion/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import * as THREE from "three";
import type { Swiper as SwiperInstance } from "swiper";
import { FreeMode } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react"; 
import ParticlePortrait from "./components/ParticlePortrait.tsx";
import {
  ArrowDownRight,
  ArrowUpRight,
  Braces,
  Check,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Menu,
  X,
} from "lucide-react";
import "swiper/css";
import "../styles/portfolio.css";

const skills = [
  "UI/UX Design",
  "Wireframing",
  "Web Design",
  "Prototyping",
  "Design Systems",
  "React",
  "Next.js",
  "TypeScript",
  "GSAP",
  "Tailwind CSS",
  "Responsive Design",
  "Accessibility",
  "Git",
  "Figma",
];
gsap.registerPlugin(ScrollTrigger);

function InstagramIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="5"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
    </svg>
  );
}

function DottedPlane() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.z = 6;
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    const points: number[] = [];
    for (let y = -2.3; y <= 2.3; y += 0.44) {
      for (let x = -2.3; x <= 2.3; x += 0.44) points.push(x, y, 0);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(points, 3),
    );
    const material = new THREE.PointsMaterial({
      color: 0xe9e9ed,
      size: 0.075,
      sizeAttenuation: true,
    });
    const plane = new THREE.Points(geometry, material);
    plane.rotation.z = -0.18;
    scene.add(plane);

    const resize = () => {
      const { width, height } = mount.getBoundingClientRect();
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    resize();

    let frame = 0;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      plane.rotation.z -= 0.00035;
      renderer.render(scene, camera);
    };
    animate();
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div className="dot-plane" ref={mountRef} aria-hidden="true" />;
}

function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="site-header">
      <a className="logo" href="#top" aria-label="Jordan Nares home">
        Jordan <span>Nares</span>
      </a>
      <div className="nav-shell">
        <nav
          className={open ? "nav-links is-open" : "nav-links"}
          aria-label="Main navigation"
        >
          <a className="active" href="#work" onClick={() => setOpen(false)}>
            Works
          </a>
          <a href="#about" onClick={() => setOpen(false)}>
            About me
          </a>
          <a href="#services" onClick={() => setOpen(false)}>
            Services
          </a>
          <a href="#contact" onClick={() => setOpen(false)}>
            Contact me
          </a>
        </nav>
        <div className="social-links">
          <a href="#behance" aria-label="Behance">
            Bē
          </a>
          <a href="#instagram" aria-label="Instagram">
            <InstagramIcon />
          </a>
          <a href="#linkedin" aria-label="LinkedIn">
            in
          </a>
        </div>
        <a className="hire-button" href="mailto:jordan@example.com">
          Hire me <ExternalLink size={17} />
        </a>
        <button
          className="menu-button"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>
    </header>
  );
}

const projects = [
  {
    number: "01",
    title: "e-Angkat",
    category: "Mobile application",
    year: "2026",
    preview: "/assets/pulse-health-preview2.png",
    description:
      "A calm mobile healthcare experience focused on making everyday care easier to navigate.",
    role: "Product design and UI development",
  },
  {
    number: "02",
    title: "Beagle Tracking Solutions",
    category: "Brand & e-commerce",
    year: "2025",
    preview: "/assets/common-ground-preview2.png",
    description:
      "A warm, editorial storefront for considered homeware and everyday objects.",
    role: "Brand direction and e-commerce design",
  },
  {
    number: "03",
    title: "iMove",
    category: "Website redesign",
    year: "2025",
    preview: "/assets/north-studio-preview2.png",
    description:
      "A nature-led studio website that gives landscape projects room to speak.",
    role: "Website redesign and UI development",
  },
];

function WorkSection() {
  const previewRef = useRef<HTMLDivElement>(null);
  const moveXRef = useRef<((value: number) => void) | null>(null);
  const moveYRef = useRef<((value: number) => void) | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [activeProject, setActiveProject] =
    useState<typeof projects[number] | null>(null);
  const [selectedProject, setSelectedProject] =
    useState<typeof projects[number] | null>(null);

  useEffect(() => {
    if (!selectedProject) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setSelectedProject(null);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedProject]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (selectedProject && !dialog.open) dialog.showModal();
    if (!selectedProject && dialog.open) dialog.close();
  }, [selectedProject]);

  useEffect(() => {
    const preview = previewRef.current;
    if (!preview) return;

    const ctx = gsap.context(() => {
      moveXRef.current = gsap.quickTo(preview, "x", {
        duration: 0.45,
        ease: "power3.out",
      });
      moveYRef.current = gsap.quickTo(preview, "y", {
        duration: 0.45,
        ease: "power3.out",
      });
    });

    return () => {
      ctx.revert();
      moveXRef.current = null;
      moveYRef.current = null;
    };
  }, []);

  const positionPreview = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const previewWidth = 300;
    const previewHeight = 230;
    const x = Math.min(
      Math.max(event.clientX + 24, 16),
      Math.max(16, window.innerWidth - previewWidth - 16),
    );
    const y = Math.min(
      Math.max(event.clientY - previewHeight / 2, 16),
      Math.max(16, window.innerHeight - previewHeight - 16),
    );
    moveXRef.current?.(x);
    moveYRef.current?.(y);
  };

  const showPreview = (
    event: ReactPointerEvent<HTMLButtonElement>,
    project: typeof projects[number],
  ) => {
    if (event.pointerType === "touch") return;
    setActiveProject(project);
    positionPreview(event);
    gsap.to(previewRef.current, {
      autoAlpha: 1,
      scale: 1,
      duration: 0.35,
      ease: "power3.out",
      overwrite: "auto",
    });
  };

  const hidePreview = () => {
    setActiveProject(null);
    gsap.to(previewRef.current, {
      autoAlpha: 0,
      scale: 0.94,
      duration: 0.25,
      ease: "power2.out",
      overwrite: "auto",
    });
  };

  const openProject = (project: typeof projects[number]) => {
    setActiveProject(null);
    gsap.to(previewRef.current, {
      autoAlpha: 0,
      scale: 0.94,
      duration: 0.2,
      ease: "power2.out",
      overwrite: "auto",
    });
    setSelectedProject(project);
  };

  const closeProject = () => setSelectedProject(null);

  return (
    <>
      <section
        className="portfolio-panel work-section section-reveal"
        id="work"
      >
        <div className="section-content work-content">
          <div className="work-heading">
            <div>
              <p className="eyebrow">Selected projects</p>
              <h3>
                Work<span>.</span>
              </h3>
            </div>
            <span className="work-heading-note">
              A selection of recent work
            </span>
          </div>
          <div className="work-list">
            {projects.map((project) => (
              <button
                type="button"
                className="work-row"
                key={project.title}
                aria-haspopup="dialog"
                onClick={() => openProject(project)}
                onPointerEnter={(event) => showPreview(event, project)}
                onPointerMove={positionPreview}
                onPointerLeave={hidePreview}
              >
                <span className="work-index">{project.number}</span>
                <span className="work-title">
                  <strong>{project.title}</strong>
                  <span className="work-inline-meta">
                    {project.category} · {project.year}
                  </span>
                </span>
                <span className="work-category">{project.category}</span>
                <span className="work-year">{project.year}</span>
                <ArrowUpRight className="work-arrow" size={22} />
              </button>
            ))}
          </div>
        </div>
      </section>
      <div
        className="work-preview"
        ref={previewRef}
        aria-hidden="true"
        data-project={activeProject?.title}
      >
        <img
          src={activeProject?.preview ?? projects[0].preview}
          alt=""
          draggable="false"
        />
      </div>
      <dialog
        className="project-dialog"
        ref={dialogRef}
        aria-labelledby="project-dialog-title"
        aria-describedby="project-dialog-description"
        onCancel={closeProject}
        onClose={closeProject}
        onClick={(event) => {
          if (event.target === event.currentTarget) closeProject();
        }}
      >
        <button
          type="button"
          className="project-dialog-close"
          aria-label="Close project details"
          onClick={closeProject}
        >
          <X size={20} />
        </button>
        {selectedProject && (
          <div className="project-dialog-layout">
            <div className="project-dialog-image">
              <img
                src={selectedProject.preview}
                alt={`${selectedProject.title} project preview`}
              />
            </div>
            <div className="project-dialog-content">
              <p className="eyebrow">Project {selectedProject.number}</p>
              <h2 id="project-dialog-title">{selectedProject.title}</h2>
              <p id="project-dialog-description">
                {selectedProject.description}
              </p>
              <dl className="project-dialog-details">
                <div>
                  <dt>Category</dt>
                  <dd>{selectedProject.category}</dd>
                </div>
                <div>
                  <dt>Year</dt>
                  <dd>{selectedProject.year}</dd>
                </div>
                <div>
                  <dt>Role</dt>
                  <dd>{selectedProject.role}</dd>
                </div>
              </dl>
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}

export default function App() {
  const rootRef = useRef<HTMLElement>(null);
  const testimonialSwiperRef = useRef<SwiperInstance | null>(null);
  const testimonialProgressRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduceMotion) return;
    const ctx = gsap.context(() => {
      gsap.from(".site-header", {
        y: -35,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
      });
      gsap.from(".portrait-wrap", {
        opacity: 0,
        scale: 0.96,
        duration: 1.2,
        delay: 0.15,
        ease: "power2.out",
      });
      gsap.from(".gs-reveal", {
        y: 28,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        delay: 0.35,
        ease: "power3.out",
      });
      gsap.from(".feature-card", {
        x: -45,
        opacity: 0,
        rotate: -2,
        duration: 0.9,
        delay: 0.75,
        ease: "back.out(1.5)",
      });
      gsap.from(".art-mark", {
        x: 50,
        opacity: 0,
        duration: 0.9,
        delay: 0.85,
        ease: "power3.out",
      });
      gsap.utils.toArray<HTMLElement>(".section-reveal").forEach((section) => {
        gsap.from(section, {
          y: 48,
          opacity: 0,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: {
            trigger: section,
            start: "top 82%",
            once: true,
          },
        });
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <main id="top" className="portfolio" ref={rootRef}>
      <Header />

      <section className="hero" id="works">
        <motion.div
          className="feature-card"
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        >
          <span className="code-icon">
            <Braces size={26} />
          </span>
          <span>
            <strong>Design + Code</strong>
            <small>One thoughtful process</small>
          </span>
          <Check className="check" size={28} />
        </motion.div>

        <div className="portrait-wrap">
          <ParticlePortrait />
        </div>

        <motion.div
          className="availability"
          animate={{ opacity: [0.75, 1, 0.75] }}
          transition={{ duration: 2.2, repeat: Infinity }}
        >
          <i /> &#123; AVAILABLE TO WORK &#125;
        </motion.div>

        <motion.div
          className="art-mark"
          whileHover={{ scale: 1.04, rotate: -2 }}
        >
          <DottedPlane />
          <div className="art-label">
            <b>*</b>
            <span>
              Design
              <br />
              Meets
              <br />
              Details
            </span>
          </div>
        </motion.div>

        <div className="intro gs-reveal">
          Hey, I’m <span>Jordan.</span>
        </div>
        <h1 className="hero-title gs-reveal">
          UI/UX DEVELOPER &amp;
          <br />
          WEB DESIGNER
        </h1>

        <div className="hero-copy">
          <p className="gs-reveal">
            I create intuitive, thoughtful web experiences by
            <br className="desktop-break" />
            combining user-centered design with clean, modern
            <br className="desktop-break" />
            code.
          </p>
          <div className="hero-actions gs-reveal">
            <motion.a
              whileHover={{ x: 3 }}
              href="#work"
              className="primary-action"
            >
              Explore my work <ArrowUpRight size={19} />
            </motion.a>
            <motion.a
              whileHover={{ x: 3 }}
              href="#about"
              className="secondary-action"
            >
              A little about me <ArrowDownRight size={19} />
            </motion.a>
          </div>
        </div>

        <div className="location gs-reveal">
          <span /> BASED IN ALBAY, PHILIPPINES
        </div>
      </section>

      <div className="portfolio-layout">
        <aside className="toolkit-sidebar">
          <h2>
            <i /> My Toolkit
          </h2>
          <div className="skill-list">
            {skills.map((skill) => (
              <span key={skill}>{skill}</span>
            ))}
          </div>
        </aside>

        <div className="portfolio-content">
          {/* <section className="portfolio-panel toolkit section-reveal" id="work">
            <div className="toolkit-content">
              <div className="toolkit-heading">
                <p>Selected experience</p>
                <h3>Building clear, useful digital experiences.</h3>
              </div>
              <div className="project-grid">
                <article className="project-card project-card-featured">
                  <span className="project-number">01</span>
                  <div>
                    <p>Product design</p>
                    <h4>Healthcare mobile app</h4>
                  </div>
                  <ArrowUpRight size={22} />
                </article>
                <article className="project-card">
                  <span className="project-number">02</span>
                  <div>
                    <p>Web design</p>
                    <h4>Creative studio website</h4>
                  </div>
                  <ArrowUpRight size={22} />
                </article>
                <article className="project-card">
                  <span className="project-number">03</span>
                  <div>
                    <p>UI development</p>
                    <h4>Interactive portfolio</h4>
                  </div>
                  <ArrowUpRight size={22} />
                </article>
              </div>
            </div>
          </section> */}

          <WorkSection />

          <section
            className="portfolio-panel service-section section-reveal"
            id="services"
          >
            <div className="section-content">
              <div className="section-heading">
                <p>What I do</p>
                <h3>
                  Design and development, from first sketch to final screen.
                </h3>
              </div>
              <div className="service-grid">
                {[
                  [
                    "01",
                    "UX & UI Design",
                    "User flows, wireframes, prototypes and polished interface systems.",
                  ],
                  [
                    "02",
                    "Web Development",
                    "Responsive, accessible websites built with clean and maintainable code.",
                  ],
                  [
                    "03",
                    "Design Systems",
                    "Reusable components and foundations that keep products consistent.",
                  ],
                ].map(([number, title, copy]) => (
                  <motion.article
                    className="service-card"
                    key={title}
                    whileHover={{ y: -8 }}
                    transition={{ type: "spring", stiffness: 250, damping: 18 }}
                  >
                    <span>{number}</span>
                    <h4>{title}</h4>
                    <p>{copy}</p>
                    <ArrowUpRight size={22} />
                  </motion.article>
                ))}
              </div>
            </div>
          </section>

          <section
            className="portfolio-panel about-section section-reveal"
            id="about"
          >
            <div className="section-content about-content">
              <motion.div
                className="about-copy"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{ duration: 0.7 }}
              >
                <p className="eyebrow">Hello, I’m Jordan</p>
                <h3>
                  I care about the details people notice and the ones they feel.
                </h3>
                <p>
                  I combine visual thinking with practical development to create
                  thoughtful products that are easy to use, distinctive and
                  ready to scale.
                </p>
              </motion.div>
              <motion.div
                className="about-mark"
                whileHover={{ rotate: 3, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 180 }}
              >
                <span>JN</span>
                <small>DESIGN + CODE</small>
              </motion.div>
            </div>
          </section>

          {/* <section
            className="testimonial-section section-reveal"
            id="testimonials"
          >
            <div className="testimonial-heading">
              <span aria-hidden="true" />
              <h2>Testimonials</h2>
            </div>
            <Swiper
              className="testimonial-track"
              modules={[FreeMode]}
              slidesPerView="auto"
              spaceBetween={18}
              freeMode={{ enabled: true, momentum: true, sticky: false }}
              grabCursor
              onSwiper={(swiper) => {
                testimonialSwiperRef.current = swiper;
                if (testimonialProgressRef.current) {
                  testimonialProgressRef.current.style.transform = `scaleX(${swiper.progress})`;
                }
              }}
              onProgress={(swiper) => {
                if (testimonialProgressRef.current) {
                  testimonialProgressRef.current.style.transform = `scaleX(${swiper.progress})`;
                }
              }}
            >
              {[
                {
                  quote:
                    "Add a client testimonial about the collaboration, the process, and the finished experience.",
                  initials: "C",
                },
                {
                  quote:
                    "Share a note from a project partner about communication, thoughtful details, and the final result.",
                  initials: "C",
                },
                {
                  quote:
                    "Use this space for genuine feedback from someone you have worked with.",
                  initials: "C",
                },
                {
                  quote:
                    "A short recommendation can highlight what made the project and working relationship successful.",
                  initials: "C",
                },
                {
                  quote:
                    "A short recommendation can highlight what made the project and working relationship successful.",
                  initials: "C",
                },
                {
                  quote:
                    "A short recommendation can highlight what made the project and working relationship successful.",
                  initials: "C",
                },
                {
                  quote:
                    "A short recommendation can highlight what made the project and working relationship successful.",
                  initials: "C",
                },
              ].map((testimonial, index) => (
                <SwiperSlide className="testimonial-card" key={index}>
                  <p className="testimonial-quote">“{testimonial.quote}”</p>
                  <div className="testimonial-author">
                    <span className="testimonial-avatar" aria-hidden="true">
                      {testimonial.initials}
                    </span>
                    <div>
                      <strong>Client name</strong>
                      <span>Project partner</span>
                    </div>
                    <span className="testimonial-linkedin" aria-hidden="true">
                      in
                    </span>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
            <div className="testimonial-controls">
              <div className="testimonial-progress" aria-hidden="true">
                <span ref={testimonialProgressRef} />
              </div>
              <div className="testimonial-buttons">
                <button
                  type="button"
                  aria-label="Previous testimonials"
                  onClick={() => testimonialSwiperRef.current?.slidePrev()}
                >
                  <ChevronLeft size={22} />
                </button>
                <button
                  type="button"
                  aria-label="Next testimonials"
                  onClick={() => testimonialSwiperRef.current?.slideNext()}
                >
                  <ChevronRight size={22} />
                </button>
              </div>
            </div>
          </section> */}

          <footer
            className="portfolio-panel site-footer section-reveal"
            id="contact"
          >
            <div className="section-content footer-content">
              <div>
                <p className="eyebrow">Start a conversation</p>
                <motion.a
                  className="footer-email"
                  href="mailto:jordan@example.com"
                  whileHover={{ x: 8 }}
                >
                  jordannares21@gmail.com <ArrowUpRight size={32} />
                </motion.a>
              </div>
              <div className="footer-bottom">
                <span>© 2026 Jordan Nares</span>
                <div>
                  <a
                    href="https://www.behance.net/jordannare4f81"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Behance
                  </a>
                  <a
                    href="https://www.instagram.com/designar21/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Instagram
                  </a>
                  <a
                    href="https://www.linkedin.com/in/jordan-nares-55084810a/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    LinkedIn
                  </a>
                </div>
                <a href="#top">Back to top ↑</a>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </main>
  );
}
