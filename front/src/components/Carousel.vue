<template>
	<div ref="carousel" class="">
		<slot></slot>
	</div>
</template>
<script>
	import { nextTick } from 'vue';
	import Flickity from 'flickity';
	import { store } from '@/components/Store';
	
	export default {
		name: 'Carousel',
		props: ['options', 'breaker'],
		data() {
			return {
				carousel: null,
				width: 0,
					observers: {
					mutation: null,
					resize: null,
				},
				ux: {
					Carousel: {
						dragging: false,
						ready: false
					}
				}
			}
		},
		beforeMount() {
			store.subscribe('ux.Carousel', this._ux_Carousel);
		},
		mounted() {
			nextTick(() => {
				const checkChildren = () => {
					if (this.$refs.carousel) {
						const children = this.$refs.carousel.children;
						if(children.length > 0 && children[0].clientWidth > 0) {

							let breaks = false;
							if (this.breaker) {
								if (children[0].parentNode.clientWidth > this.breaker) breaks = true;
							}

					    if (!breaks) this.init(children);
						} else {
							requestAnimationFrame(checkChildren);
						}
					} else {
						requestAnimationFrame(checkChildren);
					}
				}

				requestAnimationFrame(checkChildren);

				this.observers.mutation = new MutationObserver(() => requestAnimationFrame(checkChildren));

			  if (this.$refs.carousel) {
			    this.observers.mutation.observe(this.$refs.carousel, { childList: true, subtree: true });
			    this.observers.resize = new ResizeObserver(this._observe);
			    this.observers.resize.observe(this.$refs.carousel);
			  }
			});
		},
		methods: {
			Carousel(target) {
			  return new Flickity(target, {
			  	accessibility: true,
			    adaptiveHeight: true,
			    autoPlay: 5000,
			    cellAlign: this.options.cellAlign || 'left',
			    cellSelector: undefined,
			    contain: false,
			    draggable: '>1',
			    dragThreshold: 3,
			    freeScroll: false,
			    friction: 0.2,
			    groupCells: false,
			    initialIndex: 0,
			    lazyLoad: true,
			    percentPosition: true,
			    prevNextButtons: true,
			    pageDots: typeof this.options.pageDots !== 'undefined'
			      ? this.options.pageDots : true,
			    resize: true,
			    rightToLeft: false,
			    setGallerySize: true,
			    watchCSS: false,
			    wrapAround: typeof this.options.wrapAround !== 'undefined'
			      ? this.options.wrapAround : true,
			  });
			},
			_ux_Carousel(model) {
				if (model) {
					this.ux.Carousel = { ...this.ux.Carousel, ...model };
				}
			},
			_observe(entries) {
				for (let entry of entries) {
					this.width = entry.contentBoxSize[0].inlineSize;
				}
			},
			resize() {
				this.carousel.resize();
			},
			init(children) {
				if (this.options && !this.carousel) {
					store.publish('ux.Carousel', { ...this.ux.Carousel, ready: true });

					this.carousel = this.Carousel(
						this.options.target ?
					  this.$refs.carousel.querySelector(this.options.target):
					  this.$refs.carousel
					);

					store.publish('ux.Carousel.selected_index', this.carousel.selectedIndex);

					this.carousel.on('dragStart', () => {
						store.publish('ux.Carousel', { ...this.ux.Carousel, dragging: true });
					});

					this.carousel.on('change', () => {
						const selected_index = this.carousel.selectedIndex;
						store.publish('ux.Carousel.selected_index', selected_index);
					})

					this.carousel.on('settle', () => {
						setTimeout(() => (store.publish('ux.Carousel', { ...this.ux.Carousel, dragging: false })));
					});

					this.carousel.resize();
				}
			}
		}
	}
</script>
<style scoped>
	@import 'https://unpkg.com/flickity@2/dist/flickity.min.css'
</style>