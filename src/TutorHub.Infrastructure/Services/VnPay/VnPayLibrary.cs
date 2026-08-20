using System.Net;
using System.Security.Cryptography;
using System.Text;

namespace TutorHub.Infrastructure.Services.VnPay;

public class VnPayLibrary
{
    private readonly SortedList<string, string> _requestData = new(new VnPayCompare());
    private readonly SortedList<string, string> _responseData = new(new VnPayCompare());

    public void AddRequestData(string key, string value)
    {
        if (!string.IsNullOrWhiteSpace(value))
        {
            _requestData.Add(key, value);
        }
    }

    public void AddResponseData(string key, string value)
    {
        if (!string.IsNullOrWhiteSpace(value))
        {
            _responseData.Add(key, value);
        }
    }

    public string CreateRequestUrl(string baseUrl, string vnpHashSecret)
    {
        var data = new StringBuilder();
        foreach (var (key, value) in _requestData)
        {
            if (!string.IsNullOrWhiteSpace(value))
            {
                data.Append(WebUtility.UrlEncode(key) + "=" + WebUtility.UrlEncode(value) + "&");
            }
        }

        var queryString = data.ToString();
        if (queryString.Length > 0)
        {
            queryString = queryString.Remove(queryString.Length - 1, 1);
        }

        var rawData = GetRawData(_requestData);
        var secureHash = HmacSha512(vnpHashSecret, rawData);
        var paymentUrl = $"{baseUrl}?{queryString}&vnp_SecureHash={secureHash}";

        return paymentUrl;
    }

    public bool ValidateSignature(string inputHash, string secretKey)
    {
        var rawData = GetRawData(_responseData);
        var myChecksum = HmacSha512(secretKey, rawData);
        return string.Equals(myChecksum, inputHash, StringComparison.OrdinalIgnoreCase);
    }

    private static string GetRawData(SortedList<string, string> data)
    {
        var sb = new StringBuilder();
        foreach (var (key, value) in data)
        {
            if (!string.IsNullOrWhiteSpace(value))
            {
                sb.Append(WebUtility.UrlEncode(key) + "=" + WebUtility.UrlEncode(value) + "&");
            }
        }

        if (sb.Length > 0)
        {
            sb.Remove(sb.Length - 1, 1);
        }

        return sb.ToString();
    }

    private static string HmacSha512(string key, string inputData)
    {
        var hash = new StringBuilder();
        var keyBytes = Encoding.UTF8.GetBytes(key);
        var inputBytes = Encoding.UTF8.GetBytes(inputData);

        using var hmac = new HMACSHA512(keyBytes);
        var hashValue = hmac.ComputeHash(inputBytes);
        foreach (var b in hashValue)
        {
            hash.Append(b.ToString("x2"));
        }

        return hash.ToString();
    }
}
