//+------------------------------------------------------------------+
//|                                     CJ_App_Execution_Bridge.mq5  |
//|                                      Copyright 2026, CJ App      |
//|                                             https://cj.app       |
//+------------------------------------------------------------------+
#property copyright "Copyright 2026, CJ App"
#property link      "https://cj.app"
#property version   "1.00"
#property description "Listens for signals from the CJ App Local Bridge and executes trades with user confirmation."

#include <Trade\Trade.mqh>

//--- Input parameters
input double   InpLotSize     = 0.10;      // Default Lot Size
input int      InpSlippage    = 3;         // Max Slippage (Points)
input int      InpMagicNumber = 12345;     // EA Magic Number

//--- Global variables
CTrade         trade;
string         signal_file    = "mt5_signal.json";
string         trigger_file   = "mt5_signal.trg";
datetime       last_signal_time = 0;

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
{
   // Configure the trade class
   trade.SetExpertMagicNumber(InpMagicNumber);
   trade.SetDeviationInPoints(InpSlippage);
   trade.SetTypeFilling(ORDER_FILLING_FOK); // Fill or Kill
   
   // We use a high-frequency timer to check for the local file (every 250ms)
   EventSetMillisecondTimer(250);
   
   Print("CJ App Execution Bridge Started. Listening for signals...");
   return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                 |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   EventKillTimer();
   Print("CJ App Execution Bridge Stopped.");
}

//+------------------------------------------------------------------+
//| Timer function: Checks if the Python bridge created a trigger    |
//+------------------------------------------------------------------+
void OnTimer()
{
   // The python server creates a .trg file when it finishes writing the JSON.
   // This prevents MT5 from trying to read the JSON file while Python is still writing it.
   if(FileIsExist(trigger_file))
   {
      ProcessNewSignal();
   }
}

//+------------------------------------------------------------------+
//| Reads the JSON file and triggers the MessageBox execution flow   |
//+------------------------------------------------------------------+
void ProcessNewSignal()
{
   // 1. Read the JSON file content
   int file_handle = FileOpen(signal_file, FILE_READ|FILE_TXT|FILE_ANSI);
   if(file_handle == INVALID_HANDLE)
   {
      Print("Error opening signal file: ", GetLastError());
      // Delete trigger to avoid infinite loop
      FileDelete(trigger_file); 
      return;
   }
   
   string file_content = "";
   while(!FileIsEnding(file_handle))
   {
      file_content += FileReadString(file_handle);
   }
   FileClose(file_handle);
   
   // 2. Clean up both files now that we have the data in memory
   FileDelete(trigger_file);
   FileDelete(signal_file);
   
   // 3. Very basic JSON parsing (Since MQL5 doesn't have native JSON we just string match)
   // Expected Payload: {"asset": "NAS100", "type": "BUY", "variation": "V3", "timestamp": "..."}
   
   string type = "NONE";
   if(StringFind(file_content, "\"type\": \"BUY\"") >= 0) type = "BUY";
   else if(StringFind(file_content, "\"type\": \"SELL\"") >= 0) type = "SELL";
   
   string variation = "UNKNOWN";
   if(StringFind(file_content, "\"V1\"") >= 0) variation = "V1";
   if(StringFind(file_content, "\"V2\"") >= 0) variation = "V2";
   if(StringFind(file_content, "\"V3\"") >= 0) variation = "V3";
   if(StringFind(file_content, "\"V4\"") >= 0) variation = "V4";
   
   if(type == "NONE")
   {
      Print("Invalid signal received: ", file_content);
      return;
   }
   
   // 4. One-Click confirmation dialog for the Client
   string message = StringFormat("CJ App Alert: Proceed with %s on %s?\n\nStrategy: %s", type, Symbol(), variation);
   int response = MessageBox(message, "Confirm Trade Execution", MB_YESNO | MB_ICONQUESTION);
   
   if(response == IDYES)
   {
      ExecuteTrade(type);
   }
   else
   {
      Print("Trade execution cancelled by user.");
   }
}

//+------------------------------------------------------------------+
//| Executes the actual Market Order                                 |
//+------------------------------------------------------------------+
void ExecuteTrade(string type)
{
   double price;
   bool success = false;
   
   if(type == "BUY")
   {
      price = SymbolInfoDouble(Symbol(), SYMBOL_ASK);
      success = trade.Buy(InpLotSize, Symbol(), price, 0, 0, "CJ App Execution - BUY");
   }
   else if(type == "SELL")
   {
      price = SymbolInfoDouble(Symbol(), SYMBOL_BID);
      success = trade.Sell(InpLotSize, Symbol(), price, 0, 0, "CJ App Execution - SELL");
   }
   
   if(success)
   {
      Print("✅ Trade executed successfully!");
   }
   else
   {
      Print("❌ Trade execution failed. Error: ", trade.ResultRetcode(), " - ", trade.ResultRetcodeDescription());
   }
}
