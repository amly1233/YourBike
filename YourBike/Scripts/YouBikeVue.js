window.onload = function(){
    const _dataUrl = "https://tcgbusfs.blob.core.windows.net/dotapp/youbike/v2/youbike_immediate.json";
    let map, marker ;
    
    const uBikeApp = Vue.createApp({
        data: function(){
            return{
                list:[],
                rowCount:'',
                timeStamp:'',
                updateTime:'',
                searchKeyWord:'',
                area:'',
                isCheckedAvailable:'',
                sortBy:'sbi',
                styleTooltip:'',
                
            }
        },
        computed:{
            filterList:filterList,
        },
        methods:{   
            initMap:initMap,
            setMarker:setMarker,
            goMap:goMap,
            loadData:loadData,
            tooltip:tooltip,
            currentTime:currentTime,
            intervalFetchData:intervalFetchData,
        },
    
        mounted: function(){  
            this.loadData();
            this.initMap(24.996690,121.488048);    // google script before my(this) script
            this.intervalFetchData();  
            this.currentTime();
        },
    
    });
    
    const uBikeVM = uBikeApp.mount('#app') 

    function filterList() {
        var self = this;
        self.rowCount = 0;
        return this.list.filter( function ( item ) {
            //************  filter by key word  ************ 
            let filterKeyWord = item.sna.indexOf(self.searchKeyWord)!=-1 || item.ar.indexOf(self.searchKeyWord)!=-1 ;

            //************  filter by area  ************** 
            let filterArea;
            if (self.area==0){
                filterArea = item;
            }else{
                filterArea = item.sarea == self.area;
            }

            //************  filter by available  ************
            let filterAvailable;
            if (!self.isCheckedAvailable){
                filterAvailable = item
            }else{
                filterAvailable = item.sbi !=0;
            }
           
            // 計算資料筆數
            if (filterKeyWord && filterArea && filterAvailable){
                self.rowCount++
            }

            return filterKeyWord && filterArea && filterAvailable;

        } );
    }

    function loadData(){
        var self = this;
        let dataResult=[];
        axios({     
            method:'get',
            url: _dataUrl,
        }) 
        .then((response) => {     
            for (let i=0; i<response.data.length; i++){
                response.data[i]['sna']=response.data[i]['sna'].slice(11);
                response.data[i]['lat']=response.data[i]['lat'].toFixed(6);
                response.data[i]['lng']=response.data[i]['lng'].toFixed(6);  
                dataResult.push(response.data[i]);
            }     
            // sort table
            let key = self.sortBy;
            dataResult.sort(function(a,b){
                return b[key] - a[key]    // reserve
            })
            self.list = dataResult;

            // 更新資料時間
            self.updateTime = response.data[0].updateTime;
        })
        .catch((error) => console.log(error))

    };

    function tooltip(e){
        let self = this;
        let x = e.clientX;
        let y = e.clientY;
        self.styleTooltip = {
            left: (x+10)+"px",
            top: (y+10)+"px"
        }
    };

    function currentTime(){
        let current = new Date();
        let yyyy,mm,dd,hr,min,sec;
        yyyy=current.getFullYear();
        mm=(current.getMonth()+1);
        dd=current.getDate() ;
        hr=current.getHours();
        min=current.getMinutes();
        sec=current.getSeconds();
        let twoDigit = function(e){
            if (e<10){
                e='0'+e;
            };
            return e;
        }
        this.timeStamp =  yyyy+"-"+twoDigit(mm)+"-"+twoDigit(dd)+"  "+twoDigit(hr)+":"+twoDigit(min)+":"+twoDigit(sec); 
    };

    function intervalFetchData () {
        setInterval(this.currentTime, 5000);
        setInterval(this.loadData, 5000);  
    };

    function initMap(lat,lng){
        map = new google.maps.Map(document.getElementById("map"), {   // 設定地圖
            center: { lat: lat, lng: lng },
            zoom: 15, 
        });
    };
    function setMarker(lat,lng){
        //Remove previous Marker.
        if (marker != null) {
            marker.setMap(null);
        }
        marker = new google.maps.Marker({
            // 設定地標的座標
            position: { lat: lat, lng: lng },
            // 設定地標要放在哪一個地圖
            map: map
        })
        map.panTo(marker.getPosition())  //setCenter() or panTo() methods of the map to center on the marker
        marker.setMap(map);
    };
    function goMap(row){
        // window.open("https://www.google.com.tw/maps/place/"+row.lat+','+row.lng);
        setMarker(parseFloat(row.lat),parseFloat(row.lng));
    };
    
} 
