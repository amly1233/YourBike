$(function(){
    const _dataUrl= "https://tcgbusfs.blob.core.windows.net/dotapp/youbike/v2/youbike_immediate.json";
 
    loadData().then(function(){    
        eventActive();
    }).catch(function(err){
        console.log(err);
    });  

    function loadData(){   
        return $.ajax({
            url: _dataUrl,
            method: 'GET',
            dataType: 'json',
            data: '',
            async: true,　 //預設為true 非同步    
            success: onSuccess,
            error: function (err) {
                console.log(err);
            } ,
        });
    }

    function eventActive(){
        // active map & link to google map
        initMap(24.996690,121.488048);
        $(document).on('click','.location-img',function(){
            // window.open("https://www.google.com.tw/maps/place/"+$(this).siblings().text());
            let coordinate = $(this).siblings().text();
            let lat = parseFloat(coordinate.slice(0,9));
            let lng = parseFloat(coordinate.slice(10));
            setMarker(lat,lng);
        })

        // filterFunc
        $(document).on('keyup','#search-by-name', filterFunc);
        $(document).on('change','#search-by-area', filterFunc);
        $(document).on('change','#search-by-available', filterFunc);

        // refresh page & 每5秒自動更新一次
        $(document).on('click','.reload', loadData);
        window.setInterval(loadData,5000); 

        // tooltip setting
        $(document).on("mouseover",'.data-list', function(e){
            let x = e.clientX;
            let y = e.clientY;
            $('.tooltip-span').css({
                left: (x+10)+"px",
                top: (y+10)+"px"
            });
        })
    }

    // Create Table
    function onSuccess(result){  
        $('.data-list').empty();
        let html = "";
        let areas=[];
        let optionArr = [];
        // put data into table
        for (let i = 0; i < result.length; i++){
            areas.push(result[i]['sarea']);

            let stationName = result[i]['sna'].slice(11);
            let location = '<img src="Images/location.jpg" class="location-img">'+
                '<span class="location">'+ result[i]['lat'].toFixed(6) +"," + result[i]['lng'].toFixed(6)+'</span>';    
            let mouseHint = '<span class="tooltip-span"> 資料時間 : '+ result[i]['updateTime'] +'</span>';

            // data for each row
            let tr = '<td class="index"></td>'+
            '<td class="station">'+result[i]['sarea']+'</td>'+
            '<td class="stationName">'+stationName+'</td>'+
            '<td class="area">'+result[i]['ar'] +'</td>'+
            '<td>'+location+'</td>'+
            '<td class="current-available">'+result[i]['sbi']+'</td>'+
            '<td>'+result[i]['bemp']+ mouseHint +'</td>'
            // append into each row
            html+='<tr>'+ tr + '</tr>'         
        }
        $('.data-list').append(html);   //因為append是dom物件操作，若放for裡面，會每次都append一次，有效能問題

        filterFunc();     // 取得資料後直接篩選，這樣更新時才會保留篩選資訊     
        
        let areaToSet = new Set(areas);
        optionArr = Array.from(areaToSet);  

        let selected = $('#search-by-area').val();
        // console.log(selected);
        
        $('#allSelect').siblings().remove();
        for (let i = 0; i < optionArr.length; i++){
            $('#search-by-area').append('<option>'+optionArr[i]+'</option>');
        }
        $('#search-by-area').val(selected).change(); // 保留使用者篩選資訊
   
        // update bottom data time
        $('#data-time').text(result[0]['updateTime']);

    }

    function filterFunc(){
        $('.index').empty();
        let searchByName = $('#search-by-name').val();  
        let searchByArea = $('#search-by-area').val();  
        let isSearchByAvailable = $('#search-by-available').is(':checked');  

        $('.data-list tr').each(function() {
            $(this).removeClass("hide");
            if (($(this).find(".stationName, .area").text().indexOf(searchByName) == -1)  //  filter by key word
            || (isSearchByAvailable && $(this).find('.current-available').text()==0)    //  filter by available
            || ((searchByArea!=0) && searchByArea!==$(this).find('.station').text())   //  filter by area
            )
            {   
                $(this).addClass("hide");
            }
    
        });
    
        getCurrentTimeAndRowNo();
        
        sortTable();
    
        sequenceIndex();
    }

    // bottom setting
    function getCurrentTimeAndRowNo (){
        // get latest time
        let currentdate = new Date(); 
        let yyyy,mm,dd,hr,min,sec;
        yyyy=currentdate.getFullYear();
        mm=(currentdate.getMonth()+1);
        dd=currentdate.getDate() ;
        hr=currentdate.getHours();
        min=currentdate.getMinutes();
        sec=currentdate.getSeconds();
        let twoDigit = function(e){
            if (e<10){
                e='0'+e;
            };
            return e;
        }
        let current =  yyyy+"-"+twoDigit(mm)+"-"+twoDigit(dd)+"  "+twoDigit(hr)+":"+twoDigit(min)+":"+twoDigit(sec); 
        $('#current-time').text(current);
    
        // Get row length  
        let howMany = $('.data-list tr').not('.hide').length;    
        $('#data-no').text(howMany+" 筆");
    }
    
    // table sort 
    function sortTable(){
        $('.data-list').find('tr').sort(function (a,b){
            let tda = $(a).find('td:eq(5)').text();
            let tdb = $(b).find('td:eq(5)').text();
            tda = parseInt(tda);
            tdb = parseInt(tdb);
            if ( tda < tdb) return 1;
            if ( tda > tdb) return -1;
            return 0;
        }).appendTo($('.data-list'));
    } 
    
    // 給每一行資料流水編碼
    function sequenceIndex(){
        $('.index').empty();
        let count = 1;
        $('tr').not('.hide').children('.index').each(function(){
            this.append(count);
            count++ ;
        })
    }

    // 改為於表格下方嵌入Google地圖，使用Google Maps JavaScript API，點擊定位按鈕後自動定位
    let map, marker;
    function initMap(lat,lng) {     
        map = new google.maps.Map(document.getElementById("map"), {   // 設定地圖
            center: {
                lat : parseFloat( lat ),
                lng : parseFloat( lng )
            },
            zoom: 15,   
            // // 1-20，數字愈大，地圖愈細：1是世界地圖，20就會到街道
            maxZoom: 20,
            // 限制使用者能縮放地圖的最小比例
            minZoom: 3,
            // 設定是否呈現右下角街景小人
            streetViewControl: false,
            // 設定是否讓使用者可以切換地圖樣式：一般、衛星圖等
            mapTypeControl: false
        });
    }
    function setMarker(lat,lng){
        //Remove previous Marker.
        if (marker != null) {
            marker.setMap(null);
        }
        //Set Marker on Map.
        marker = new google.maps.Marker({    
            position: {
                lat : parseFloat( lat ),
                lng : parseFloat( lng )
            },
            map: map
        });
        
        map.panTo(marker.getPosition())  //setCenter() or panTo() methods of the map to center on the marker
        marker.setMap(map);
    }

   
    
    // icon anim reverse toogleClass mouseenter mouseleave
    // css animation rotate or transition:transform 2s;
})
