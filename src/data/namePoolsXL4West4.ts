// =============================================================================
// Namenspools, fünfte Stufe – Teil England, Schottland, USA, Australien,
// Neuseeland und Karibik in England (Rohdaten, zusammengesetzt in
// data/namePoolsXL4West.ts). Familiennamen nach den Ranglisten der häufigsten
// Namen (ONS/Forebears für England und Wales, NRS Scotland, US Census 2000/2010,
// Telefonbuch-Rangfolgen Australien/Neuseeland) mit regionaler Streuung: Lancashire/
// Yorkshire, Nordosten, Midlands, West Country/Cornwall, East Anglia, walisische
// und irische Namen in England; Highlands/Lowlands; in den USA auch hispanische und
// afroamerikanische Namen, in Australien Einwanderer aus Italien/Griechenland/
// Jugoslawien, in Neuseeland Māori und Pazifik. Karibik: jamaikanische, barbadische
// und trinidadische Namen (überwiegend solche, die in England selten sind).
// Vornamen je Geburtsjahrzehnt (ONS Baby Names, NRS, SSA, BDM NZ/NSW).
// =============================================================================
import type { XLNames } from './namePoolsXL';
import { w } from './namePoolsXL';

/** Klassische englische Jungennamen, die in jedem Jahrzehnt häufig sind. */
const ENG_CORE = w(`James, John, David, Michael, Paul, Peter, Richard, Robert, Andrew, Thomas, William, Daniel, Christopher, Matthew, Anthony, Joseph, Edward, Stephen, Mark, Simon, Martin, Philip, Nicholas, Jonathan, Benjamin, Samuel, Charles, Alexander, Henry, George`);
const st = (core: string[], extra: string): string[] => [...core, ...w(extra)];

export const XL4_WEST_ENG: Record<string, XLNames> = {
  eng: {
    last: w(`Ackroyd, Ainsworth, Appleby, Ashworth, Bamford, Barraclough, Battersby, Birch, Blackburn, Bottomley, Bradshaw, Brearley, Briggs, Broadbent, Brooke, Butterworth, Calvert, Cartwright, Crabtree, Crossley, Crowther, Dobson, Duckworth, Entwistle, Fairclough, Fawcett, Fenwick, Gaskell,
Greenwood, Haigh, Halliday, Haworth, Heaton, Holden, Holroyd, Horsfall, Howarth, Illingworth, Ingham, Kershaw, Lockwood, Lord, Marsden, Mellor, Metcalfe, Midgley, Moorhouse, Nuttall, Ogden, Pickles, Pollard, Rhodes, Rushton, Schofield, Sharples, Shackleton, Stansfield, Sugden, Sutcliffe, Swales, Thornton,
Tomlinson, Walmsley, Whiteley, Whittaker, Worthington, Wolstenholme, Heslop, Liddle, Short, Tate, Wardle, Forster, Dodds, Nixon, Ridley, Hedley, Elliott, Bradbury, Chell, Hollins, Salt, Shenton, Tunnicliffe, Brough, Cotterill, Hadley, Partridge, Bowden, Chapple, Coombes, Dyer,
Hosking, Jago, Moyle, Pascoe, Penrose, Retallick, Trewin, Uren, Vosper, Lobb, Luxton, Snell, Squire, Tucker, Vickery, Yeo, Northcott, Endacott, Hellyer, Huxtable, Pengelly, Thurston, Howlett, Pegg, Mayhew, Moy, Peck, Dye, Nunn, Spink, Sparkes, Thrower, Whiting, Brennan, Byrne, Callaghan, Connolly, Costello,
Daly, Doherty, Donnelly, Duffy, Dunne, Fitzgerald, Flanagan, Flynn, Gallagher, Hanlon, Healy, Kavanagh, Mahoney, McCormack, McGrath, McGuinness, McLoughlin, Moran, Mulligan, Nolan, O'Donnell, O'Hara, O'Leary, O'Reilly, O'Sullivan, Regan, Riordan, Shea, Sheridan, Sweeney, Tierney, Whelan, Bowen, Howells,
Llewellyn, Pugh, Rowlands, Prosser, Probert, Bevan, Gwynne, Ellis, Price, Parry, Pritchard, Watkins, Jenkins, Lloyd, Griffiths, Rees, Hopkins, Morgan, Phillips, Bennett, Cooke, Bates, Burgess, Bishop, Walton, Nicholson, Shepherd, Cross, Long, Freeman, Warren, Nicholls, Sutton, Yates, Hodgson, Curtis,
Harper, Coleman, Moss, Chambers, Griffin, Sharp, Wheeler, Osborne, Doyle, Rowe, Burke, May, Gilbert, Willis, Higgins, Read, Miles, Stevenson, Stephenson, Hammond, Arnold, Buckley, Walters, Hewitt, Barber, Slater, Austin, Whitehead, Frost, Lambert, Stephens, Blake, Lynch, Goodwin, Woodward,
Cunningham, Quinn, Barnett, Baxter, Clayton, Nash, Marshall, Simpson, Wilkinson, Foster, Chapman, Webb, Rogers, Mason, Matthews, Palmer, Holmes, Mills, Knight, Butler, Russell, Barker, Fisher, Harvey, Graham, Pearson, Fletcher, Walsh, Gibson, Howard, Andrews, Saunders,
Payne, Fox, Day, Brooks, Lawrence, Atkinson, Bradley, Spencer, Gill, Dawson, Burton, O'Brien, Watts, Rose, Booth, Perry, Wells, Hayes, Hudson, Barrett, Webster, Hunter, Gregory, Carr, Lowe, Marsh, Riley, Dunn, Woods, Parsons, Berry, Stone, Holland,
Hawkins, Harding, Porter, Oliver, Reed, Williamson, Bird, Gardner, Dean, Lane, Burns, Ross, Johnston, Gordon, Wallace, George, Hutchinson, Abbott, Adamson, Akers, Alcock, Allsopp, Ambrose, Archer, Arkwright, Ashton, Aspinall, Astley, Avery, Bagshaw, Bainbridge,
Bartlett, Beaumont, Beckett, Benson, Bentley, Bevington, Biggs, Bingham, Blackwell, Blakemore, Boswell, Boulton, Bowers, Bowler, Brady, Bramley, Brewer, Bridges, Brierley, Brindley, Broome, Buckingham, Bull, Bunting, Burrows, Cadman, Carey, Carpenter, Carver, Chadwick,
Challenger, Chandler, Clamp, Coates, Cockburn, Collier, Collinson, Cooksey, Cope, Corbett, Cowley, Crane, Cresswell, Croft, Crook, Cullen, Dakin, Dale, Daniels, Darby, Davey, Dennis, Denton, Dickinson, Dodd, Dolan, Downes, Duke, Dyson, Earnshaw, Eaton, Eccles, Eden, Edge, Emery, Everett,
Farmer, Farrell, Faulkner, Field, Finch, Fleming, Foley, Forrest, Frank, Frith, Fuller, Garner, Garside, Gee, Gilmore, Glover, Godfrey, Golding, Goode, Gough, Gould, Greaves, Grimshaw, Hackett, Haley, Hancock, Hanson, Harrop, Hartley, Hayward, Heath, Hesketh, Hickman, Hilton,
Hobson, Holt, Hooper, Hope, Horne, Horton, Houghton, Howe, Hoyle, Hull, Humphreys, Hyde, Ingram, Ives, Jarvis, Jeffery, Jennings, Jessop, Kay, Kemp, Kent, Kerr, Kirby, Kirk, Kitchen, Lamb, Lancaster, Langley, Lawson, Leach, Leigh, Lester, Lindley, Little, Lomas, Lucas, Lund, Lyons, Mackay, Maddox,
Manning, Marriott, Matthewson, Maxwell, Mellows, Merrick, Middleton, Moody, Morley, Morton, Moseley, Mottram, Myers, Naylor, Neale, Needham, Noble, Norman, Norris, North, Norton, Oakes, Oldfield, Orme, Ormerod, Overton, Pace, Parkin, Parkinson, Pattinson, Peacock, Pemberton,
Pickering, Pike, Pilling, Pope, Poole, Preston, Pryor, Radcliffe, Ramsden, Randall, Ratcliffe, Rawlinson, Raynor, Redfern, Rich, Riddell, Rigby, Ripley, Rowley, Royle, Sadler, Sanderson, Savage, Sayer, Seddon, Senior, Sexton, Seymour, Sharpe, Sheldon, Shirley, Simmonds, Skinner, Smales, Smallwood,
Southern, Spooner, Stafford, Stanton, Starkey, Steele, Storey, Street, Stubbs, Swift, Swindells, Talbot, Threlfall, Tindall, Tipton, Todd, Towers, Townsend, Travis, Tyler, Underwood, Unwin, Upton, Vernon, Vincent, Wade, Waite, Wainwright, Wakefield, Warburton, Ware,
Waring, Waterhouse, Waters, Weston, Whitaker, Whitfield, Whitworth, Wickham, Wild, Wiles, Wilkes, Winter, Wolfe, Woodhouse, Woolley, Wragg, Wyatt, Yeomans`),
    eras: [
      [0, st(ENG_CORE, `Albert, Alec, Alex, Alfred, Allan, Archie, Arthur, Barry, Basil, Bernard, Bert, Bill, Billy, Bob, Bobby, Brian, Bryan, Cecil, Charlie, Clifford, Clive, Colin, Cyril, Dave, Denis, Dennis, Derek, Desmond, Dick, Don, Donald, Douglas, Duncan, Eddie, Edgar, Eric, Ernest, Ernie, Francis, Frank, Fred, Frederick,
Geoff, Geoffrey, Gerald, Gilbert, Gordon, Graham, Harold, Harry, Herbert, Horace, Howard, Hugh, Ian, Ivor, Jack, Jeffrey, Jim, Jimmy, Joe, Keith, Ken, Kenneth, Laurence, Lawrence, Len, Leonard, Les, Leslie, Lewis, Lionel, Malcolm, Maurice, Mervyn, Mick, Mike, Neville, Noel, Norman, Owen, Pat, Patrick, Percy, Phil,
Ralph, Ray, Raymond, Reg, Reginald, Rex, Rodney, Roger, Ron, Ronald, Roy, Sam, Sid, Sidney, Stan, Stanley, Stuart, Sydney, Ted, Terence, Terry, Tom, Tommy, Tony, Trevor, Vernon, Victor, Vincent, Wally, Walter, Wilf, Wilfred`)],
      [1950, st(ENG_CORE, `Adrian, Alan, Alec, Alistair, Allan, Barry, Bernard, Bill, Billy, Bob, Bobby, Brian, Bryan, Carl, Chris, Cliff, Clive, Colin, Danny, Dave, Denis, Dennis, Derek, Des, Dick, Dougie, Duncan, Eddie, Frank, Gary, Gavin, Geoff, Gerald, Gerry, Glen, Gordon, Graeme, Graham, Grahame, Gregory, Harry, Howard, Hugh,
Ian, Jeff, Jeffrey, Jim, Jimmy, Joe, Julian, Keith, Ken, Kenneth, Kenny, Kevin, Laurie, Leslie, Lloyd, Malcolm, Melvyn, Mervyn, Mick, Mickey, Mike, Neil, Nigel, Noel, Norman, Owen, Pat, Patrick, Phil, Ray, Raymond, Rex, Rob, Robin, Rodney, Roger, Ron, Ronnie, Rory, Roy, Russell, Shaun, Stan, Steve, Stuart, Ted,
Terence, Terry, Tim, Tom, Tommy, Tony, Trevor, Vic, Victor, Vince`)],
      [1960, st(ENG_CORE, `Adrian, Alan, Alistair, Andy, Antony, Barry, Ben, Brian, Carl, Chris, Clifford, Clive, Colin, Craig, Dale, Damian, Danny, Darren, Dave, Dean, Derek, Dominic, Duncan, Gareth, Garry, Gary, Gavin, Geoff, Gerard, Glen, Glenn, Gordon, Graham, Grant, Gregory, Guy, Howard, Ian, Jamie, Jason, Jeff, Jeremy, Jim, Joe, Jon,
Julian, Justin, Karl, Keith, Kenny, Kevin, Kieran, Laurence, Lee, Leigh, Lloyd, Malcolm, Marc, Marcus, Martyn, Matt, Mick, Mike, Mitchell, Neil, Neville, Nick, Nigel, Owen, Patrick, Phil, Ray, Rob, Robin, Rodney, Roger, Ross, Russell, Scott, Sean, Shane, Shaun, Spencer, Steve, Stuart, Terry, Tim, Toby, Tom, Tony,
Trevor, Troy, Vince, Vincent, Warren, Wayne`)],
      [1970, st(ENG_CORE, `Aaron, Adam, Adrian, Alan, Alex, Alistair, Andy, Antony, Ashley, Barney, Barry, Ben, Bradley, Brett, Carl, Carlton, Chris, Christian, Clint, Colin, Craig, Damian, Damien, Dan, Danny, Darren, Darryl, Dave, Dean, Dominic, Elliot, Gareth, Gary, Gavin, Gerard, Glen, Gordon, Graham, Grant, Greg, Gregory, Guy, Ian,
Jake, Jamie, Jason, Jay, Jeremy, Jody, Joe, Joel, Jon, Jordan, Justin, Karl, Keith, Kelvin, Kenny, Kevin, Kieran, Kirk, Kris, Lee, Leon, Lewis, Liam, Lloyd, Luke, Marc, Marcus, Martyn, Matt, Mitchell, Nathan, Neil, Nick, Nicky, Oliver, Owen, Patrick, Phil, Rhys, Ricky, Rob, Robbie, Robin, Rory, Ross, Russell,
Ryan, Sam, Scott, Sean, Shane, Shaun, Spencer, Steve, Stewart, Stuart, Terry, Tim, Toby, Tom, Tony, Tristan, Troy, Vincent, Warren, Wayne`)],
      [1980, st(ENG_CORE, `Aaron, Adam, Alex, Alistair, Ashley, Ben, Billy, Bobby, Bradley, Brandon, Callum, Cameron, Carl, Charlie, Chris, Christian, Connor, Craig, Curtis, Dale, Dan, Danny, Darren, Dave, Dean, Declan, Dominic, Dylan, Elliot, Ellis, Ethan, Gareth, Gary, Gavin, Greg, Harry, Jack, Jacob, Jake, Jamie, Jason, Jay, Joe,
Joel, Jon, Jordan, Josh, Joshua, Kane, Karl, Kevin, Kieran, Kyle, Lee, Leon, Lewis, Liam, Lloyd, Luke, Marc, Marcus, Matt, Max, Mitchell, Nathan, Neil, Nick, Oliver, Ollie, Owen, Phil, Reece, Reiss, Rhys, Ricky, Rob, Robbie, Rory, Ross, Ryan, Sam, Sammy, Scott, Sean, Shane, Shaun, Steve, Stuart, Terry, Toby,
Tom, Tommy, Tony, Tyler, Wayne, Wesley, Zak`)],
      [1990, st(ENG_CORE, `Aaron, Adam, Aidan, Alex, Alfie, Archie, Bailey, Ben, Billy, Bradley, Brandon, Callum, Cameron, Charlie, Ciaran, Connor, Conor, Corey, Curtis, Dan, Danny, Dean, Declan, Dominic, Dylan, Elliot, Elliott, Ellis, Ethan, Ewan, Finley, Frankie, Freddie, Gabriel, Harley, Harrison, Harry, Harvey, Hayden, Isaac,
Jack, Jacob, Jake, Jamie, Jay, Jayden, Joe, Joel, Jordan, Jordon, Josh, Joshua, Jude, Kai, Kane, Kian, Kieran, Kyle, Leo, Leon, Levi, Lewis, Liam, Lloyd, Logan, Louis, Lucas, Luke, Marcus, Mason, Max, Mitchell, Morgan, Myles, Nathan, Niall, Noah, Oliver, Ollie, Owen, Reece, Reiss, Rhys, Ricky, Robbie, Rory,
Ross, Ryan, Sam, Scott, Sean, Sonny, Spencer, Stefan, Taylor, Theo, Toby, Tom, Tommy, Tyler, Will, Zach, Zak`)],
      [2000, st(ENG_CORE, `Aaron, Adam, Aiden, Alex, Alfie, Archie, Arthur, Ashton, Bailey, Ben, Billy, Blake, Bobby, Bradley, Brandon, Caleb, Callum, Cameron, Charlie, Cody, Connor, Corey, Declan, Dexter, Dominic, Dylan, Elijah, Elliot, Ellis, Ethan, Evan, Ewan, Finley, Finn, Frankie, Fraser, Freddie, Gabriel, Harley, Harrison, Harry,
Harvey, Hayden, Hugo, Isaac, Jack, Jacob, Jake, Jamie, Jayden, Jenson, Jesse, Joe, Joel, Jonah, Jordan, Josh, Jude, Kai, Kian, Kieran, Leo, Leon, Levi, Lewis, Liam, Logan, Louie, Louis, Luca, Lucas, Luke, Mason, Max, Morgan, Myles, Nathan, Niall, Noah, Oliver, Ollie, Oscar, Owen, Reece, Reggie, Reuben, Rhys,
Riley, Ronnie, Rory, Ruben, Ryan, Sam, Sebastian, Sonny, Spencer, Stanley, Taylor, Ted, Teddy, Theo, Tobias, Toby, Tom, Tommy, Tyler, Zac, Zachary, Zak`)],
      [2010, st(ENG_CORE, `Albert, Albie, Alfie, Archie, Arlo, Arthur, Ashton, Austin, Blake, Bobby, Brody, Caleb, Carter, Charlie, Cody, Dexter, Dylan, Eddie, Elijah, Elliot, Ellis, Ethan, Evan, Ezra, Felix, Finley, Finn, Frankie, Freddie, Frederick, Gabriel, Grayson, Harley, Harrison, Harry, Harvey, Hugo, Hunter, Isaac, Jack, Jacob,
Jake, Jasper, Jaxon, Jayden, Jenson, Jesse, Joey, Jonah, Joshua, Jude, Kai, Kian, Lenny, Leo, Leon, Leonardo, Lewis, Liam, Lincoln, Logan, Louie, Louis, Luca, Lucas, Luke, Mason, Max, Maxwell, Milo, Myles, Nathan, Nico, Noah, Oakley, Oliver, Ollie, Oscar, Otis, Ralph, Reggie, Reuben, Riley, Rocco, Roman,
Ronnie, Rory, Rowan, Rupert, Ryan, Sebastian, Seth, Sonny, Stanley, Ted, Teddy, Theo, Theodore, Tobias, Toby, Tommy, Tyler, Vinnie, Wilfred, Zac, Zachary`)],
    ],
  },
  sco: {
    last: w(`Adam, Adamson, Aird, Allan, Allison, Arthur, Bain, Ballantyne, Bannerman, Barclay, Barr, Baxter, Beattie, Bell, Bisset, Blair, Borthwick, Boyle, Brodie, Bruce, Bryce, Burnett, Cairns, Calder, Caldwell, Callaghan, Carmichael, Carr, Chalmers, Christie, Clark, Cochrane, Colquhoun, Connell, Cowan, Crichton,
Cruickshank, Cumming, Currie, Dalziel, Dewar, Dick, Dickson, Dingwall, Dobbie, Donald, Donaldson, Drummond, Dunbar, Dunlop, Elder, Erskine, Ewing, Fairley, Farquhar, Findlay, Finlayson, Fleming, Forbes, Forsyth, Fyfe, Galbraith, Gall, Gardiner, Geddes, Gemmell, Gilchrist, Gillies, Gilmour, Glen, Gow, Greig, Grieve,
Guthrie, Haig, Halliday, Harper, Harvey, Hastie, Hendry, Henry, Hogg, Houston, Howie, Hutcheson, Hutchison, Imrie, Inglis, Innes, Irvine, Jamieson, Jardine, Kay, Keir, Keith, Kelly, Kirk, Kirkwood, Laidlaw, Laing, Lamb, Lamont, Lang, Lawrie, Lawson, Leckie, Leitch, Leslie, Livingstone, Lockhart, Logan, Love, Low,
Lyon, MacAulay, MacDougall, MacFarlane, MacGregor, MacInnes, MacIntyre, MacIver, MacKinnon, MacLachlan, MacLennan, MacMillan, MacNeil, MacPhee, MacRae, Mackie, Main, Mair, Malcolm, Marshall, Mathieson, Maxwell, McAlpine, McArthur, McAulay, McBride, McCabe, McColl, McConnell, McCormick, McCulloch, McDermott,
McDougall, McEwan, McFadden, McFarlane, McGill, McGowan, McGuire, McHugh, McInnes, McKenna, McKinnon, McLachlan, McLaughlin, McLellan, McLennan, McManus, McNab, McNally, McNeill, McNicol, McPhee, McRae, McWilliam, Meikle, Menzies, Milne, Moffat, Moir, Montgomery, Moore, Morton, Mowat, Muirhead,
Murdoch, Nairn, Neil, Neilson, Nicol, Nicolson, Niven, Ogilvie, Orr, Park, Paton, Pollock, Porteous, Pringle, Rae, Rankin, Reilly, Rennie, Renton, Riddell, Ritchie, Robb, Rodger, Rose, Russell, Rutherford, Scobie, Shand, Sharp, Sim, Sloan, Smart, Spence, Steel, Stevenson, Stirling, Stuart, Swan, Tait,
Tennant, Thom, Todd, Urquhart, Waddell, Weir, Whyte, Wilkie, Wood, Wylie, Yule, Gallagher, Devlin, Quinn, Hughes, Brennan, Coyle, Duffy, Feeney, Friel, Gormley, Logue, Mulholland, O'Donnell, Rafferty, Toner, Aitchison, Bennie, Brownlie, Buchan, Craik, Duguid, Fordyce, Gauld, Jaffray, Kinnear, Lumsden,
Mackintosh, Mearns, Middleton, Mitchell, Petrie, Rattray, Reekie, Sangster, Shirreffs, Skene, Taylor, Thain, Troup, Wishart`),
    eras: [
      [0, w(`Alastair, Alec, Alexander, Alick, Allan, Ally, Angus, Archibald, Arthur, Bert, Bill, Calum, Charles, Colin, Dan, Danny, Dave, David, Donald, Dougal, Douglas, Duncan, Eck, Euan, Ewan, Ewen, Fergus, Finlay, Frank, Gavin, George, Gilbert, Graham, Gregor, Hector, Henry, Hughie, Iain, Innes, Jack, James, Jamie, Joe, Johnny,
Joseph, Keith, Kenneth, Lachlan, Lawrence, Lewis, Matthew, Michael, Murdo, Murray, Ninian, Norman, Pat, Patrick, Peter, Ramsay, Robert, Robin, Roderick, Ronald, Ronnie, Ross, Sam, Stewart, Thomas, Tom, Tommy, Torquil, Walter, William`)],
      [1965, w(`Alasdair, Alastair, Alex, Alexander, Allan, Ally, Andy, Angus, Barry, Billy, Callum, Calum, Charlie, Chris, Christopher, Craig, Dale, Daniel, Danny, Darren, Dave, Dean, Dougie, Douglas, Duncan, Eddie, Euan, Ewan, Fergus, Fraser, Gareth, Garry, Gerry, Gordon, Gregor, Hamish, Hugh, Iain, Ian, James, Jamie, Jim, Jimmy,
Joe, John, Jonathan, Kenneth, Kenny, Kieran, Lee, Lindsay, Malcolm, Matthew, Michael, Mike, Neil, Niall, Paul, Peter, Richard, Robbie, Robert, Roddy, Ronnie, Russell, Ryan, Sean, Shaun, Simon, Stephen, Steve, Stevie, Thomas, Tommy, Tony, Willie`)],
      [1990, w(`Adam, Aidan, Alasdair, Alexander, Alistair, Andrew, Angus, Archie, Ben, Blair, Calum, Charlie, Christopher, Ciaran, Conor, Craig, Daniel, Darren, David, Declan, Dominic, Duncan, Eoin, Ethan, Euan, Fergus, Finn, Gary, Gavin, Grant, Gregor, Hamish, Harry, Iain, Innes, Jack, Jake, James, Jamie, Joe, John, Jonathan,
Joseph, Josh, Kerr, Kevin, Lachlan, Lee, Liam, Logan, Mark, Martin, Matthew, Max, Michael, Nathan, Niall, Oliver, Owen, Paul, Robbie, Robert, Ross, Ruairidh, Sam, Scott, Stephen, Steven, Stewart, Thomas, Tom, Zak`)],
      [2005, w(`Aaron, Adam, Aiden, Alexander, Alfie, Andrew, Angus, Archie, Arran, Ben, Brodie, Caleb, Callan, Callum, Calum, Cameron, Charlie, Cole, Connor, Daniel, David, Dylan, Ethan, Euan, Evan, Ewan, Finlay, Finn, Fraser, Gregor, Hamish, Harris, Harry, Harvey, Isaac, Jack, Jacob, Jake, James, Jamie, Jay, Jayden, Joe,
Jordan, Joseph, Josh, Kai, Kyle, Lachlan, Leo, Lewis, Liam, Logan, Lucas, Luke, Mason, Matthew, Max, Michael, Murray, Nathan, Noah, Oliver, Oscar, Reece, Rhys, Robbie, Rory, Ryan, Sam, Scott, Sean, Thomas, Tyler, Alastair, Blair, Calvin, Corey, Craig, Dominic, Fergus, Innes, Kerr, Kian, Kieran, Niall, Owen, Ross, Struan, Zak`)],
    ],
  },
  usa: {
    last: w(`Alexander, Alvarez, Andrews, Arnold, Austin, Bailey, Banks, Barker, Barnes, Bates, Beck, Bell, Bennett, Benson, Berry, Bishop, Booker, Bowman, Boyd, Bradley, Brennan, Bryant, Burke, Burns, Burton, Butler, Byrd, Caldwell, Carlson, Carpenter, Carr, Carroll, Castillo, Castro, Chambers, Chandler,
Chapman, Chavez, Clayton, Cobb, Cole, Coleman, Conrad, Cox, Craig, Crawford, Cruz, Cunningham, Curtis, Dalton, Daniels, Davenport, Davidson, Dawson, Day, Dennis, Diaz, Dixon, Doyle, Duncan, Dunn, Durham, Elliott, Ellis, Erickson, Farmer, Ferguson, Fernandez, Fields, Fischer, Fisher, Fleming, Fletcher,
Flores, Floyd, Flynn, Fowler, Fox, Freeman, Fuller, Gaines, Gallagher, Gardner, Garrett, Garza, Gilbert, Glover, Gomez, Gonzales, Gonzalez, Gordon, Graham, Grant, Graves, Greene, Gregory, Griffin, Gross, Guerrero, Gutierrez, Hale, Hamilton, Hampton, Hansen, Hanson, Hardy, Harmon, Harper, Harrison,
Hartman, Harvey, Hawkins, Hayes, Henderson, Henry, Herrera, Hicks, Hines, Hoffman, Hogan, Holland, Holmes, Holt, Hopkins, Horton, Houston, Howell, Hudson, Hunter, Ingram, Jacobs, Jenkins, Jennings, Jensen, Johnston, Joseph, Keller, Klein, Knight, Kowalski, Kramer, Lambert, Lane, Larson,
Lawrence, Lawson, Lindsey, Little, Lombardi, Long, Lowe, Lucas, Lynch, Lyons, Mahoney, Malone, Mann, Marino, Marshall, Mason, Matthews, Maxwell, McCarthy, McCoy, McDaniel, McDonald, McKinney, Medina, Mendoza, Meyer, Mills, Montgomery, Morales, Moreno, Mosley, Moss, Myers, Nichols,
Norton, Novak, O'Brien, O'Connor, Oliver, Olson, Ortiz, Palmer, Parks, Parsons, Patterson, Patton, Payne, Pearson, Pena, Perkins, Perry, Peters, Pierce, Porter, Price, Quinn, Ramirez, Ramos, Randolph, Reid, Reyes, Rhodes, Rice, Richards, Riley, Rios, Rivera, Robbins, Robertson,
Romano, Romero, Rose, Rowe, Ruiz, Russo, Ryan, Salazar, Sanchez, Sandoval, Saunders, Schmidt, Schneider, Schultz, Schwartz, Sharp, Shaw, Shelton, Silva, Simmons, Simpson, Sims, Snyder, Soto, Spencer, Stanley, Steele, Stephens, Stevens, Stone, Strickland, Sutton, Swanson, Thornton, Todd, Torres, Townsend, Tucker,
Valdez, Vargas, Vaughn, Wade, Wagner, Walsh, Walton, Ware, Warren, Waters, Watkins, Watts, Weaver, Webb, Weber, Welch, Wells, Wheeler, Wilkins, Wolfe, Woods, Yates, Zimmerman, Acosta, Aguilar, Becker, Bauer, Christensen, Delgado, Dominguez, Espinoza, Estrada, Figueroa, Fuentes, Herrmann, Jimenez,
Kaufman, Kline, Koch, Lara, Lindquist, Luna, Mendez, Munoz, Navarro, Nielsen, Pacheco, Petersen, Rasmussen, Rojas, Rubio, Sorensen, Vasquez, Vega, Walters, Wolf`),
    eras: [
      [0, w(`Albert, Allen, Andy, Art, Arthur, Barry, Ben, Bert, Billy, Bobby, Bruce, Carl, Chuck, Clarence, Cliff, Curtis, Dale, Danny, Darrell, Dean, Dennis, Dick, Doug, Earl, Eddie, Edward, Elmer, Ernie, Eugene, Floyd, Fred, Gene, George, Gerald, Glen, Gordon, Hank, Harold, Harry, Herb, Howard, Jack, Jerry,
Jimmy, Johnny, Keith, Ken, Kenny, Lee, Leon, Lloyd, Lou, Lyle, Marvin, Mel, Milton, Norm, Pat, Paul, Pete, Phil, Ralph, Ray, Rich, Rick, Rodney, Roger, Roy, Russ, Sam, Stan, Ted, Terry, Tim, Tony, Vern, Vince, Warren, Wayne, Wendell, Willie`)],
      [1970, w(`Aaron, Adam, Andrew, Anthony, Ben, Bill, Billy, Bobby, Brandon, Brent, Bryan, Carlos, Chad, Charles, Clint, Corey, Craig, Dan, Danny, Darren, David, Dean, Derek, Derrick, Dustin, Dwayne, Erik, Gabe, Garrett, Grant, Heath, Jamie, Jared, Jay, Jeremy, Jerome, Jesse, Joel, Johnny, Jonathan, Jose, Joshua, Juan,
Justin, Kelly, Kenny, Lance, Larry, Lee, Luis, Manny, Marc, Marcus, Mario, Michael, Mike, Nathan, Nick, Patrick, Paul, Pete, Phil, Randy, Ray, Ricky, Rob, Robert, Rodney, Ron, Russell, Sean, Seth, Shane, Shawn, Stephen, Terrence, Todd, Tommy, Travis, Trent, Troy, Tyrone, Wade, Wes, Will`)],
      [1990, w(`Adam, Adrian, Alejandro, Andrew, Angel, Anthony, Austin, Benjamin, Blake, Brendan, Brett, Bryce, Cameron, Carlos, Carter, Chase, Chris, Cody, Colby, Colin, Collin, Corey, Dakota, Dalton, Daniel, Darius, David, Derek, Devin, Diego, Dominic, Drew, Dustin, Eli, Elijah, Eric, Evan, Gabriel, Garrett, Gavin, Grant, Hunter,
Ian, Isaac, Isaiah, Jack, Jackson, Jacob, Jake, Jalen, Jared, Jason, Javier, Jeremy, Jesse, Jesus, Joel, Jonathan, Jorge, Jose, Joseph, Juan, Julian, Kevin, Lucas, Luis, Luke, Mario, Matthew, Max, Miguel, Nathan, Nicholas, Noah, Omar, Patrick, Paul, Peter, Ricardo, Riley, Robert, Sam, Samuel, Sean, Seth,
Spencer, Steven, Taylor, Thomas, Travis, Trevor, Tristan, Victor, Wyatt, Xavier, Zachary`)],
      [2005, w(`Aiden, Alex, Alexander, Andre, Andres, Angel, Anthony, Asher, Austin, Benjamin, Bennett, Brayden, Bryson, Caleb, Cameron, Carlos, Carson, Carter, Chase, Christian, Christopher, Cole, Colton, Connor, Cooper, Damian, Daniel, Darius, David, Diego, Dylan, Easton, Eli, Elijah, Emmanuel, Ethan, Evan, Ezra, Gabriel,
Gavin, Grayson, Henry, Hudson, Hunter, Ian, Isaac, Isaiah, Jack, Jackson, Jacob, Jaden, Jake, Jalen, Jamal, James, Jason, Jaxon, Jayden, Jeremiah, Jonah, Jose, Joseph, Josiah, Juan, Julian, Kaden, Landon, Leo, Levi, Liam, Lincoln, Logan, Lucas, Luis, Luke, Malachi, Marquis, Mason, Mateo, Matthew, Micah, Miles,
Nathan, Nicholas, Nolan, Owen, Parker, Roman, Ryan, Ryder, Samuel, Santiago, Sebastian, Terrell, Thomas, Tristan, Tyler, Tyrese, Weston, William, Wyatt, Xavier, Zachary`)],
    ],
  },
  aus: {
    last: w(`Adams, Allen, Atkinson, Baker, Barker, Barnes, Bell, Bennett, Bird, Bradley, Brennan, Brooks, Burgess, Burke, Burns, Butler, Byrne, Carroll, Carter, Chapman, Clark, Cole, Collins, Connolly, Cook, Cooper, Cox, Crawford, Cross, Cunningham, Daly, Davis, Dawson, Day, Dixon, Doyle,
Duncan, Dunn, Ellis, Ferguson, Fisher, Fitzgerald, Fletcher, Ford, Foster, Fraser, Gibson, Gill, Graham, Grant, Gray, Hamilton, Harding, Harper, Hart, Harvey, Hayes, Henderson, Higgins, Hill, Hodges, Holmes, Hudson, Hunter, James, Jenkins, Johnston, Kerr, Knight, Lawrence, Lewis, Lynch, Marshall, Mason,
Matthews, McDonald, McKenzie, Mills, Morgan, Murray, Nelson, Nicholson, O'Brien, O'Connor, O'Neill, Owen, Palmer, Pearce, Phillips, Porter, Powell, Price, Quinn, Reid, Richards, Richardson, Roberts, Robertson, Rogers, Ross, Shaw, Simpson, Stewart, Sullivan, Sutton, Turner,
Walsh, Ward, Watson, Watts, Webb, Wells, West, Williamson, Wood, Woods, Bianchi, Costa, Ferraro, Rossi, Russo, Romano, Marino, Esposito, Colombo, De Luca, Papadakis, Georgiou, Dimitriou, Karagiannis, Konstantinidis, Petrovic, Jovanovic, Nikolic, Markovic, Horvat, Babic, Vukovic, Stojanovic, Kovac, Jansen,
de Jong, Visser, Brady, Doherty, Gallagher, Maher, Nolan, Sheehan, Tobin`),
    eras: [
      [0, w(`Alan, Allan, Andrew, Barry, Bill, Bob, Brett, Brian, Bruce, Chris, Colin, Craig, Darren, Daryl, David, Dean, Dennis, Des, Doug, Frank, Garry, Gary, Geoff, Glenn, Gordon, Graham, Grant, Greg, Ian, Jason, Jeff, Jim, Joe, John, Keith, Ken, Kevin, Kim, Lindsay, Lyle, Mal, Mark, Martin, Max, Michael, Mick, Murray, Neil,
Noel, Paul, Peter, Phil, Ray, Rex, Rob, Robbie, Rod, Ron, Ross, Roy, Russell, Scott, Shane, Stephen, Steve, Stuart, Terry, Tim, Tom, Tony, Trevor, Wally, Warren, Wayne, Con, George, Nick, Vince`)],
      [1975, w(`Aaron, Adam, Adrian, Andrew, Ante, Anthony, Ashley, Ben, Blake, Brad, Brendan, Brent, Brett, Brodie, Cameron, Chris, Clint, Corey, Craig, Damian, Damien, Dane, Daniel, Darren, David, Dean, Drew, George, Glen, Grant, Heath, Jake, James, Jamie, Jarrod, Jason, Jesse, Joel, Jon, Jordan, Josh, Justin, Kane, Kieran,
Kristian, Kurt, Lachlan, Leigh, Liam, Luke, Marco, Marcus, Mark, Mathew, Matt, Michael, Mitch, Nathan, Nicholas, Nick, Paul, Peter, Rhys, Robbie, Ryan, Sam, Scott, Sean, Shane, Simon, Steve, Stuart, Tim, Todd, Tom, Tony, Travis, Tristan, Troy, Wade, Zac`)],
      [1995, w(`Aaron, Adam, Aiden, Alex, Angus, Archie, Bailey, Beau, Ben, Blake, Brodie, Caleb, Callum, Cameron, Charlie, Connor, Cooper, Corey, Daniel, Dylan, Ethan, Flynn, Hamish, Harrison, Harry, Hayden, Henry, Hugo, Hunter, Isaac, Jack, Jackson, Jacob, Jai, Jake, James, Jarrah, Jesse, Joel, Jordan, Joshua, Jye, Kai, Kane,
Kye, Lachlan, Liam, Lincoln, Logan, Luca, Lucas, Luka, Luke, Marco, Mason, Matthew, Max, Mitchell, Nathan, Nick, Nikola, Noah, Oliver, Oscar, Patrick, Riley, Ryan, Sam, Samuel, Sebastian, Stefan, Thomas, Tom, Tyler, Will, William, Xavier, Zac, Zachary`)],
    ],
  },
  nzl: {
    last: w(`Adams, Allan, Baker, Barnes, Bennett, Bird, Boyd, Brooks, Burns, Carter, Chapman, Cook, Cooper, Cox, Craig, Davies, Davis, Dixon, Duncan, Edwards, Ferguson, Fisher, Fraser, Gibson, Gordon, Graham, Grant, Gray, Green, Hamilton, Harrison, Hart, Hay, Henderson, Hill, Hunt, Hunter,
James, Johnson, Johnston, Kerr, Lewis, Lloyd, MacDonald, Marshall, McKenzie, Miller, Moore, Morgan, Morris, Murray, Nicholson, Paterson, Phillips, Price, Richards, Roberts, Robertson, Ross, Russell, Scott, Shaw, Simpson, Stevens, Stewart, Sutherland, Turner, Wallace, Ward, Watson, Watt, Webb, White,
Williams, Wright, Henare, Hohaia, Kereama, Parata, Rangi, Tamihana, Tipene, Waaka, Wihongi, Paewai, Ruru, Tahu, Karaka, Pomare, Rewiti, Ngatai, Poutama, Te Whata, Leota, Fonoti, Tupou, Fifita, Taufa, Aitken, Baird, Broughton, Buchanan, Fleming, Gillespie, Hewitt, Hughes, Kennedy, McLeod, Munro, Reid, Ritchie,
Sinclair, Tait, Thomson, Walsh, Wilkinson`),
    eras: [
      [0, w(`Alan, Allan, Barry, Bill, Bob, Brent, Brian, Bruce, Colin, Dave, David, Dennis, Don, Doug, Garry, Gary, Geoff, Glen, Gordon, Graham, Grant, Hemi, Ian, Ivan, Jim, John, Keith, Ken, Kerry, Kevin, Lindsay, Malcolm, Mark, Michael, Murray, Neil, Noel, Paul, Peter, Phil, Rawiri, Rex, Richard, Robert, Roger, Ross, Russell,
Selwyn, Sid, Steve, Stuart, Terry, Tony, Trevor, Warren, Wayne, Wiremu, Wynton`)],
      [1975, w(`Aaron, Adam, Andrew, Anthony, Ben, Blair, Brendon, Brent, Cameron, Carl, Chris, Craig, Daniel, Darren, David, Dean, Duane, Glen, Grant, Hamish, Hemi, Jamie, Jason, Jeremy, Joe, Jonathan, Josh, Justin, Kane, Karl, Kurt, Liam, Luke, Marc, Mark, Matthew, Michael, Mike, Nathan, Nick, Paul, Rangi, Rhys, Richard, Ricky,
Rory, Ryan, Sam, Scott, Sean, Shane, Simon, Stephen, Tama, Tane, Tim, Toby, Todd, Tom, Troy, Wade, Wiremu`)],
      [1995, w(`Aidan, Alex, Angus, Archie, Bailey, Ben, Blake, Caleb, Callum, Cameron, Charlie, Cooper, Corey, Daniel, Dylan, Elijah, Ethan, Finn, Flynn, George, Hamish, Harry, Hayden, Ihaia, Isaac, Jack, Jackson, Jacob, Jake, James, Jayden, Joel, Jordan, Joseph, Joshua, Kahu, Leo, Liam, Logan, Lucas, Luke, Manaia, Mason,
Matthew, Max, Mitchell, Nathan, Nikau, Noah, Oliver, Oscar, Riley, Ruben, Ryan, Sam, Samuel, Sione, Tamati, Thomas, Tom, Tyler, William, Wiremu, Zac`)],
    ],
  },
  eng_car: {
    last: w(`Alleyne, Anglin, Baptiste, Bartley, Beckford, Blackman, Blackwood, Blagrove, Bogle, Bonner, Burrell, Callender, Christie, Coke, Crooks, Dacres, Dawkins, Dunkley, Ebanks, Ennis, Fearon, Forbes, Forde, Fraser, Gittens, Greenidge, Grizzle,
Haughton, Haynes, Hibbert, Hinds, Holder, Inniss, Irons, Jarrett, Joseph, Lashley, Levy, Lewin, Licorish, Malcolm, Maragh, Mathurin, Mattis, McCalla, McFarlane, McKoy, McLean, Minott, Murrell, Nembhard, Nurse, Ottey,
Phillip, Pierre, Pilgrim, Pinnock, Pryce, Quashie, Rhoden, Ricketts, Salmon, Sealy, Sewell, Smart, Springer, St Hilaire, Trotman, Tulloch, Vassell, Wedderburn, Weekes, Whyte, Wilks, Wint, Worrell, Wray, Wynter,
Yearwood, Antoine, Felix, Noel, Caesar, Ferguson, Bisson, Fagan, Headley, Lindsay, Lyn, Mullings, Nugent, Peart, Plummer, Rattray, Scarlett, Taffe, Tapper,
Welsh, Whitter, Wiltshire,
Bucknor, Bloomfield, Dyce, Flowers, Hemmings, Lyttle, McIntosh, Myrie, Pottinger, Samms, Smikle, Tingling, Wilmot, Witter, Bovell, Brathwaite, Cozier, Gibbons, Griffith, Hoyte, Husbands, Mayers, Prescod, Roach, Skeete, Small, Waithe,
Bascombe, Belgrave, Blenman, Boothe, Byfield, Cadogan, Codrington, Edghill, Eversley, Gollop, Hinkson, Ifill, Jemmott, Kirton, Layne, Maycock, Mottley, Odle, Padmore, Parris, Quintyne, Sandiford, Scantlebury, Yarde, Bembridge, Dawes, Earle, Farquharson, Gentles, Grandison, Heron, McLeggon, Morant, Ormsby, Powe, Seivwright, Stennett, Thame, Wallen, Cudjoe, Shillingford, Hosein`),
    eras: [
      [0, w(`Aubrey, Barrington, Basil, Calvin, Carl, Cecil, Cedric, Clement, Clifford, Clinton, Courtney, Cuthbert, Delbert, Devon, Donovan, Earl, Egbert, Elroy, Ephraim, Everald, Ezekiel, Fitzroy, Garfield, Gladstone, Glenroy, Hopeton, Horace, Ivan, Joseph, Lascelles, Leon, Leroy, Linford, Lionel, Livingstone,
Lorenzo, Lowell, Maurice, Milton, Neville, Norris, Orville, Osbourne, Percival, Ricardo, Rudolph, Rupert, Samuel, Selvin, Sylvester, Tony, Ulric, Vernon, Wesley, Wilfred`)],
      [1965, w(`Adrian, Alton, Andre, Anthony, Barrington, Brian, Carlton, Chris, Clayton, Clifton, Colin, Courtney, Craig, Damian, Darren, Dean, Delroy, Denton, Desmond, Devon, Donovan, Dwight, Elliot, Errol, Everton, Fitzroy, Garth, Gary, Glen, Howard, Jason, Jerome, Joel, Junior, Justin, Karl, Kelvin, Kenneth, Lee,
Leon, Linton, Lloyd, Marcus, Mark, Marlon, Martin, Maurice, Michael, Nathan, Neil, Noel, Paul, Ricky, Robert, Royston, Ruel, Sean, Steve, Trevor, Troy, Tyrone, Vincent, Wayne, Wesley`)],
      [1990, w(`Aaron, Adrian, Akeem, Andre, Ashley, Benjamin, Brandon, Cameron, Chris, Christian, Connor, Corey, Curtis, Daniel, Dante, Darnell, Darren, Dexter, Dion, Dominic, Elijah, Elliot, Ethan, Ezekiel, Gabriel, Isaac, Isaiah, Jamal, Jamie, Jarell, Jason, Javon, Jaylen, Jerome, Jermaine, Joel, Jordan, Josh, Joshua,
Jovan, Kadeem, Kai, Kayden, Kemar, Kieran, Kyle, Leon, Levi, Liam, Louis, Luke, Malachi, Malik, Marcus, Mason, Micah, Nathan, Nathaniel, Omari, Reece, Reiss, Rhys, Ryan, Shaquille, Tariq, Tre, Trey, Tyler, Tyreke, Tyrell, Tyrese, Zion`)],
      [2005, w(`Alexander, Amari, Ashton, Bradley, Caleb, Cameron, Daniel, Darius, Devonte, Elias, Elijah, Ezra, Isaac, Isaiah, Jaden, Jahiem, Jahmal, Jamari, Jayden, Jaylon, Jesse, Joel, Jonah, Joshua, Josiah, Jude, Kai, Kaiden, Kairo, Kaylan, Kemari, Kian, Kobe, Leon, Levi, Liam, Malachi, Mason, Micah, Myles, Nathan,
Nathaniel, Noah, Omari, Reuben, Rico, Romeo, Ruben, Samuel, Theo, Tobi, Tyrese, Tyrique, Zachary, Zayden, Zion`)],
    ],
  },
};
