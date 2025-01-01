
/**
 * 
 * @param {boxShadow} boxShadowACtive: The boxShadow styling is applied when the element is active. Default is '0px 0px 20px 4px #00ff'
 * @param {border} border: Border styling applied to all elements in this class. Default is '1pt solid #eee'
 */
function Resizable(boxShadowACtive = null, border = null) 
{
    //box-shadow: oofset-x, offset-y, blur-radius, spread-radius
    let BoxShadowActive = boxShadowACtive ?? '0px 0px 20px 4px #00ff';
    let Border = border ?? '1pt solid #eee'
 
    //const BoxShadowActive = '0px 0px 2px 4px #00ff';
    const MinHeight = 20;
    const MinWidth = 40;

    window.document.addEventListener("load", loadResizables);

    //listen for mousedown and mouseup and touchstart and touchend
    window.document.addEventListener("mouseup", handleMouseUp); 
    window.document.addEventListener("touchend", handleMouseUp);
    
    //prevent drag interference
    window.ondragstart = (event)=>{
        event.preventDefault();
        return false;
    }
    
    //stop the window from scrolling with safari
    // window.document.addEventListener('touchmove', 
    // function(e) {
    //     e.preventDefault();
    // }, { passive: false });

    var s0x = 0;    //initial point x
    var s0y = 0;    //initial point y
    
    let Elem;
    let Elems = getInteractables();
    let Target;

    //append (clone) elements for resizing
    function loadResizables(Border){
        const resizables = window.document.getElementsByClassName("resizable");
        const moveables = window.document.getElementsByClassName("moveable");
        const dockables = window.document.getElementsByClassName("dockable");
        const slidables = window.document.getElementsByClassName("slidable");

        const resizeElem = window.document.createElement("img");
        const dockElem = window.document.createElement("img");
        const slideElem = window.document.createElement("img");

        resizeElem.ondragstart = (event)=>{
            event.preventDefault();
            return false;
        }
        resizeElem.setAttribute("src", "https://srcengine.github.io/Interactables/drawing-resize_plain.svg");
        resizeElem.className = "resize";
        resizeElem.style = "position: absolute; bottom: 0; right: 0; cursor: nw-resize; width: 1rem; height: 1rem"

        slideElem.ondragstart = (event)=>{
            event.preventDefault();
            return false;
        }
        slideElem.setAttribute("src", "https://srcengine.github.io/Interactables/drawing-slide.svg");
        slideElem.className = "slide";
        slideElem.style = "left:0; position: absolute; width: 99%; height: 0.5rem; cursor: ns-resize; bottom: 0";

        dockElem.ondragstart = (event)=>{
            event.preventDefault();
            return false;
        }
        dockElem.setAttribute("src", "https://srcengine.github.io/Interactables/dock_plain.svg");
        dockElem.className = "dock";
        dockElem.style = "position: absolute; width: 1rem; height: 1rem; cursor: pointer; top: 0; left: 0";

        for (const elem in Elems)
        {
            if (Object.hasOwnProperty.call(Elems, elem))
            {
                let element = Elems[elem];
                element.style['border'] = Border;
                element.style['position'] = "relative";
                element.style['overflow'] = "clip";
            }
        }
        
        for (const elem in resizables)
        {
            if (Object.hasOwnProperty.call(resizables, elem))
            {
                let element = resizables[elem];
                let el = element.appendChild(resizeElem.cloneNode(true));
                el.addEventListener("mousedown", handleMouseDown);
                el.addEventListener("touchstart", handleMouseDown);

            }
        }

        for (const elem in slidables)
        {
            if (Object.hasOwnProperty.call(slidables, elem))
            {
                let element = slidables[elem];
                let el = element.appendChild(slideElem.cloneNode(true));
                el.addEventListener("mousedown", handleMouseDown);
                el.addEventListener("touchstart", handleMouseDown);
            }
        }
        
        //append the icon and add the listeners
        for (const elem in moveables) {
            if (Object.hasOwnProperty.call(moveables, elem)) {
                let element = moveables[elem];
                element.addEventListener("mousedown", handleMouseDown);
                element.addEventListener("touchstart", handleMouseDown);

                element.style['cursor'] = "all-scroll";
            }
        }

        //append the icon and add the listeners
        for (const elem in dockables) {
            if (Object.hasOwnProperty.call(dockables, elem)) {
                let element = dockables[elem];
                let el = element.appendChild(dockElem.cloneNode(true));
                el.addEventListener("dblclick", handleDblClick);

                if (element.classList.contains('docked')) element.style['position']="relative"
                else if (element.classList.contains('undocked')) element.style['position']="absolute";

                if (!element.style['top'])
                {
                    element.style['top'] = window.getComputedStyle(element, "top");
                    if (element.style['top'] == "")
                    {
                        if (element.classList.contains('docked')) element.style['top'] = Number(element.getClientRects()['top']).toFixed(2) + "px";
                        else if (element.classList.contains('undocked')) element.style['top'] = Number(element.getBoundingClientRect()['top']).toFixed(2) + "px";
                    }
                }
            }
        }
    }
    loadResizables(Border);
    
    

    /**
     * Looks for a container html element to use as this elements
     * docked container. Loops through the class names of the element.
     * If the element is class'd with "DockedTo-" + id of an element, then return the id.
     * Else If the parent-element has an id, class elemenet with "DockedTo-" + id, then return id.
     * @param {html element} el html element that is dockable
     * @returns id of docked container element, if found. Otherwise, returns "".
     */ 
    function isNodeable(el)
    {
        let match;  //the match from regex statement
        
        //loop through class names
        for (let i=0; i < el.classList.length; i++)
        {
            //check if 'DockedTo-*' is found in classes
            match = String(el.classList[i]).match(/DockedTo-+(\S+)/);
            
            //if the element is classified with 'DockedTo-' + id
            //we just need to check the element with id exists
            if (match) 
            {
                //return the container's id
                let el = document.getElementById(match[1]);

                //if the container element exists, return it's id 
                if (el) return String(match[1]);
            }
            //else if the container has an id, use it
            //and add it to the element's class names 
        }

        if (el.parentElement.id)
        {
            el.classList.add("DockedTo-" + el.parentElement.id);
            return String(el.parentElement.id);
        }
        //leaviong the loop means we did not find a container,
        //so return notta ""
        return "";
    }

    function filterUnique(value, index, array)
    {
        return array.indexOf(value) === index;
    }

    //get an array of all interactable elements
    function getInteractables()
    {
        let moveables = Array.from(window.document.getElementsByClassName("moveable"));
        let slidables = Array.from(window.document.getElementsByClassName("slidable"));
        let dockables = Array.from(window.document.getElementsByClassName("dockable"));
        let resizables = Array.from(window.document.getElementsByClassName("resizable"));
        
        let elems = Array().concat(moveables, slidables, dockables, resizables);
        
        let Elems = elems.filter(filterUnique);
        return Elems;
    }

    function isClass(el, cls)
    {
        let match;  //the match from regex statement
        let re = new RegExp(String.raw`${cls}`);

        for (let i=0; i < el.classList.length; i++)
        {
            cls = el.classList[i];
            match = String(el.classList[i]).match(re);
            if (match) return match[0];
        }
        return "";
    }
    
    function handleDblClick(event)
    {        
        let el = event.target.parentElement;
        let isNdbl = isNodeable(el);
        
        if (el){
            event.preventDefault();
            el.style['top'] = '0';
            el.style['left'] = '0';

            //if the element is docked (ie not undocked)
            if (el.style['position'] != 'absolute') 
            {
                el.style['position'] = 'absolute';
                el.classList.add('undocked');
                el.classList.remove('docked');
                
                if (isNdbl != "") {
                    //undock element and append to body
                    document.getElementsByTagName("BODY")[0].appendChild(el);
                }
            }
            else 
            {
                el.style['position'] = 'relative'
                el.classList.add('docked');
                el.classList.remove('undocked');

                if (isNdbl != "") {
                    //dock element and append to the parent it is dockedTo (bound)
                    window.document.getElementById(isNdbl).appendChild(el);
                }
            };
        }
    }

    function handleMouseDown(event)
    {
        event.preventDefault();
        Target = event.target;
        //lem;
        
        //get the initial point the client clicked on
        if (event.type == "touchstart")
        {
            //if event.type = 'touchstart' then event.touches[0].clientX(x,y) is the touch point
            s0x = event.touches[0].clientX;
            s0y = event.touches[0].clientY;
        }
        else 
        {
            s0x = event.clientX;
            s0y = event.clientY;
        }
        
        //if target is 'resize', register mousemove event listener
        if (Target.className==("resize"))
        {
            //shift Elem to it's parent
            Elem = Target.parentElement;
            //listen for mousemove and touchmove to resize element
            window.document.addEventListener("mousemove", resize, {passive: false});
            window.document.addEventListener("touchmove", resize, {passive: false});
        }
        else if (Target.className=="slide")
        {
            Elem = Target.parentElement;
            window.document.addEventListener("mousemove", resize, {passive: false});
            window.document.addEventListener("touchmove", resize, {passive: false});
        }
        //else if target is 'moveable', register mousemove event listener
        else if (this.className.includes("moveable"))
        {
            //target the moveable element
            Elem = this;
            window.document.addEventListener("mousemove", move, {passive: false});
            window.document.addEventListener("touchmove", move, {passive: false});
        }
    }

    function handleMouseUp(event)
    {
        //event.preventDefault();
        //stop listening for mousemove on mouseup
        if (Elem) {
            Elem.style["box-shadow"] = 'none';
            Elem = undefined;
        }
        window.document.removeEventListener("touchmove", resize);
        window.document.removeEventListener("touchmove", move);
        window.document.removeEventListener("mousemove", resize);
        window.document.removeEventListener("mousemove", move);
        
        //Elem = null;
    }
    
    function bringElemToTop()
    {
        Elem.style["z-index"] = 1;  //bring to top
        Elem.style["box-shadow"] = BoxShadowActive;

        for (const el in Elems) {
            if (Object.hasOwnProperty.call(Elems, el)) {
                const element = Elems[el];
                if (Elem != element) element.style["z-index"] = 0;   //bring to bottom
            }
        }
    }

    function move(event)
    {
        event.preventDefault();
        //Elem = Target;

        let clientX, clientY;
        
        //let moveables = window.document.getElementsByClassName("moveable");

        if (event.type == "touchmove")
        {
            clientX = event.touches[0].clientX;
            clientY = event.touches[0].clientY;
        }
        else {
            clientX = event.clientX;
            clientY = event.clientY;
        }
        
        bringElemToTop();       

        //the current position of Elem
        let top = Number(String(Elem.style["top"]).replace("px",""));
        let left = Number(String(Elem.style["left"]).replace("px",""));
        let width = Number(String(Elem.style["width"]).replace("px",""));
        let height = Number(String(Elem.style["height"]).replace("px",""));

        //this is the position that the user wants
        //dY = clientY - s0y, 
        let Top = Number(top + clientY - s0y);
        let Left = Number(left + clientX - s0x);

        let Body = window.document.getElementsByTagName("BODY")[0];
        let Parent;

        if (Elem.classList.contains("undocked")) Parent = Body
        else Parent = Elem.parentElement;

        if 
        (
            (Top >= 0 && ((Top + height) < (Parent.clientTop + Parent.clientHeight))) || 
            (Top < 0 && event.movementY > 0) ||
            (((Top + height) > (Parent.clientTop + Parent.clientHeight)) && event.movementY < 0)
        )
        {
            Elem.style["top"] = Number(Top).toFixed(3) + "px";
        }
        
        if 
        (
            (Left >= 0 && ((Left + width) < (Parent.clientLeft + Parent.clientWidth))) ||
            (Left < 0 && event.movementX > 0) ||
            ((Left + width) > (Parent.clientLeft + Parent.clientWidth) && event.movementX < 0)
        )
        {
            Elem.style["left"] = Left + "px";
        }

        //reset the initial point to the instantaneous point
        s0x = clientX;
        s0y = clientY;
    }

    function resize(event) 
    {
        //prevent default events from occurring
        event.preventDefault();
        
        //the point that was touched
        let clientX, clientY;       
        
        //bring element to top       
        bringElemToTop();

        //style the element as active
        Elem.style["box-shadow"] = BoxShadowActive;

        //get the point that was touched or moused
        if (event.type == "touchmove")
        {
            clientX = event.touches[0].clientX;
            clientY = event.touches[0].clientY;
        }
        else {
            clientX = event.clientX;
            clientY = event.clientY;
        }
        
        var W0 = Number(String(window.getComputedStyle(Elem)["width"]).replace("px",""));
        var H0 = Number(String(window.getComputedStyle(Elem)["height"]).replace("px",""));

        //the width and height that we want
        var w = W0 + clientX - s0x;
        var h = H0 + clientY - s0y;

        //the current width and height of the element
        if (Target.className=="slide"){
            //change the width and height if they are greter than minimum
            if (h > MinHeight) Elem.style["height"] = Number(h).toFixed(2) + "px";
        }
        else if (Target.className=="resize") {
            //change the width and height if they are greter than minimum
            if (w > MinWidth) Elem.style["width"] = Number(w).toFixed(2) + "px";
            if (h > MinHeight) Elem.style["height"] = Number(h).toFixed(2) + "px";
        
        }
        
        //reset the initial point to the instantaneous point
        s0x = clientX;
        s0y = clientY;
    }
 
}
//Resizable();
