import { mount } from 'svelte'
import App from './App.svelte'
import '@shoelace-style/shoelace/dist/themes/light.css';
import { setBasePath, registerIconLibrary } from '@shoelace-style/shoelace';
import './app.css'

setBasePath('https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.20.1/cdn/');

registerIconLibrary('pixelarticons', {
    resolver: name => {
 
      return `/assets/icons/${name}.svg`
    },
    mutator: svg => svg.setAttribute('fill', 'currentColor')
});

const app = mount(App, {
  target: document.getElementById('app')!,
})

export default app

